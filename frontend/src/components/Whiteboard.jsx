
import { useEffect, useRef, useState } from "react";
import { useSyncSpaceStore } from "../store/syncSpaceStore";
import CodeEditor from "./CodeEditor";
import socket from "../socket";
import "./Whiteboard.css";

function Whiteboard({ roomId, userName }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const currentItemRef = useRef(null);
    const strokesRef = useRef([]);

    // ==========================================
    // ZUSTAND STATE
    // ==========================================

    const color = useSyncSpaceStore(
        (state) => state.selectedColor
    );

    const setColor = useSyncSpaceStore(
        (state) => state.setSelectedColor
    );

    const lineWidth = useSyncSpaceStore(
        (state) => state.brushSize
    );

    const setLineWidth = useSyncSpaceStore(
        (state) => state.setBrushSize
    );

    const tool = useSyncSpaceStore(
        (state) => state.selectedTool
    );

    const setTool = useSyncSpaceStore(
        (state) => state.setSelectedTool
    );

    // ==========================================
    // LOCAL STATE
    // ==========================================

    const [textSize, setTextSize] = useState(24);
    const [textEditor, setTextEditor] = useState(null);

    // Other users' cursors
    const [remoteCursors, setRemoteCursors] = useState({});

    // ==========================================
    // USER ID / CURSOR COLOR
    // ==========================================

    const userIdRef = useRef(
        localStorage.getItem("syncspace_user_id") ||
        crypto.randomUUID()
    );

    useEffect(() => {
        localStorage.setItem(
            "syncspace_user_id",
            userIdRef.current
        );
    }, []);

    const cursorColorRef = useRef(
        localStorage.getItem("syncspace_cursor_color") ||
        "#6366f1"
    );

    useEffect(() => {
        localStorage.setItem(
            "syncspace_cursor_color",
            cursorColorRef.current
        );
    }, []);

    // ==========================================
    // SEND EVENT TO BACKEND
    // ==========================================

    const publish = (message) => {
        if (!roomId) return;

        socket.emit("whiteboard-event", {
            roomId,
            userId: userIdRef.current,
            userName: userName || "Guest",
            cursorColor: cursorColorRef.current,
            ...message,
        });
    };

    // ==========================================
    // DRAW ONE ITEM
    // ==========================================

    const drawItem = (item) => {
        const canvas = canvasRef.current;

        if (!canvas || !item) return;

        const context = canvas.getContext("2d");

        context.save();

        context.fillStyle = item.color;
        context.strokeStyle = item.color;
        context.lineWidth = item.width || 3;
        context.lineCap = "round";
        context.lineJoin = "round";

        // ======================================
        // TEXT
        // ======================================

        if (item.type === "text") {
            context.globalCompositeOperation = "source-over";

            context.font = `${item.width || 24}px sans-serif`;

            context.fillText(
                item.text,
                item.points[0].x,
                item.points[0].y
            );

            context.restore();
            return;
        }

        // ======================================
        // RECTANGLE
        // ======================================

        if (item.type === "rectangle") {
            context.globalCompositeOperation = "source-over";

            const start = item.points[0];
            const end = item.points[item.points.length - 1];

            const width = end.x - start.x;
            const height = end.y - start.y;

            context.strokeRect(
                start.x,
                start.y,
                width,
                height
            );

            context.restore();
            return;
        }

        // ======================================
        // FREEHAND / ERASER
        // ======================================

        context.globalCompositeOperation =
            item.tool === "eraser"
                ? "destination-out"
                : "source-over";

        if (!item.points || item.points.length === 0) {
            context.restore();
            return;
        }

        context.beginPath();

        context.moveTo(
            item.points[0].x,
            item.points[0].y
        );

        item.points.slice(1).forEach((point) => {
            context.lineTo(point.x, point.y);
        });

        context.stroke();
        context.closePath();

        context.restore();
    };

    // ==========================================
    // REDRAW ENTIRE CANVAS
    // ==========================================

    const redraw = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        strokesRef.current.forEach(drawItem);

        // Draw item currently being created
        if (currentItemRef.current) {
            drawItem(currentItemRef.current);
        }
    };

    // ==========================================
    // CANVAS SIZE
    // ==========================================

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();

            const previousWidth = canvas.width;
            const previousHeight = canvas.height;

            canvas.width = rect.width;
            canvas.height = rect.height;

            // Avoid unused-variable warnings
            void previousWidth;
            void previousHeight;

            const context = canvas.getContext("2d");

            context.lineCap = "round";
            context.lineJoin = "round";

            redraw();
        };

        resizeCanvas();

        window.addEventListener(
            "resize",
            resizeCanvas
        );

        return () => {
            window.removeEventListener(
                "resize",
                resizeCanvas
            );
        };
    }, []);

    // ==========================================
    // SOCKET.IO WHITEBOARD CONNECTION
    // ==========================================

    useEffect(() => {
        if (!roomId) return;

        const handleWhiteboardEvent = (message) => {
            if (!message) return;

            if (message.roomId !== roomId) return;

            // ======================================
            // REMOTE DRAWING
            // ======================================

            if (message.type === "whiteboard-item") {
                if (!message.item) return;

                strokesRef.current.push(
                    message.item
                );

                redraw();
            }

            // ======================================
            // CLEAR BOARD
            // ======================================

            if (message.type === "whiteboard-clear") {
                strokesRef.current = [];

                currentItemRef.current = null;

                redraw();
            }

            // ======================================
            // REMOTE CURSOR
            // ======================================

            if (message.type === "cursor-move") {
                // Don't render our own cursor
                if (
                    message.userId ===
                    userIdRef.current
                ) {
                    return;
                }

                setRemoteCursors((previous) => ({
                    ...previous,
                    [message.userId]: {
                        userId: message.userId,
                        userName:
                            message.userName ||
                            "Guest",
                        color:
                            message.cursorColor ||
                            "#6366f1",
                        x: message.x,
                        y: message.y,
                    },
                }));
            }

            // ======================================
            // USER LEFT
            // ======================================

            if (message.type === "cursor-leave") {
                setRemoteCursors((previous) => {
                    const next = {
                        ...previous,
                    };

                    delete next[message.userId];

                    return next;
                });
            }
        };

        socket.on(
            "whiteboard-event",
            handleWhiteboardEvent
        );

        return () => {
            socket.off(
                "whiteboard-event",
                handleWhiteboardEvent
            );
        };
    }, [roomId]);

    // ==========================================
    // GET CANVAS POSITION
    // ==========================================

    const getPosition = (event) => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return {
                x: 0,
                y: 0,
            };
        }

        const rect =
            canvas.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    // ==========================================
    // SEND CURSOR POSITION
    // ==========================================

    const sendCursorPosition = (event) => {
        if (!roomId) return;

        const point = getPosition(event);

        publish({
            type: "cursor-move",
            x: point.x,
            y: point.y,
        });
    };

    // ==========================================
    // START DRAWING
    // ==========================================

    const startDrawing = (event) => {
        if (tool === "text") return;

        event.currentTarget.setPointerCapture?.(
            event.pointerId
        );

        const point = getPosition(event);

        drawingRef.current = true;

        // ======================================
        // RECTANGLE
        // ======================================

        if (tool === "rectangle") {
            currentItemRef.current = {
                type: "rectangle",
                color,
                width: lineWidth,
                points: [
                    point,
                    point,
                ],
            };

            redraw();

            return;
        }

        // ======================================
        // FREEHAND / ERASER
        // ======================================

        currentItemRef.current = {
            type: "stroke",
            tool,
            color,
            width: lineWidth,
            points: [point],
        };

        redraw();
    };

    // ==========================================
    // DRAW / UPDATE CURRENT ITEM
    // ==========================================

    const draw = (event) => {
        // Always send cursor movement
        sendCursorPosition(event);

        if (!drawingRef.current) {
            return;
        }

        const point = getPosition(event);

        const item = currentItemRef.current;

        if (!item) return;

        // ======================================
        // RECTANGLE
        // ======================================

        if (item.type === "rectangle") {
            item.points[1] = point;

            redraw();

            return;
        }

        // ======================================
        // FREEHAND
        // ======================================

        item.points.push(point);

        redraw();
    };

    // ==========================================
    // STOP DRAWING
    // ==========================================

    const stopDrawing = (event) => {
        if (!drawingRef.current) {
            return;
        }

        const item = currentItemRef.current;

        if (item) {
            strokesRef.current.push(item);

            publish({
                type: "whiteboard-item",
                item,
            });
        }

        drawingRef.current = false;

        currentItemRef.current = null;

        redraw();

        event?.currentTarget.releasePointerCapture?.(
            event.pointerId
        );
    };

    // ==========================================
    // OPEN TEXT EDITOR
    // ==========================================

    const openTextEditor = (event) => {
        if (
            tool !== "text" ||
            textEditor
        ) {
            return;
        }

        const point = getPosition(event);

        setTextEditor({
            ...point,
            value: "",
        });
    };

    // ==========================================
    // COMMIT TEXT
    // ==========================================

    const commitText = () => {
        if (!textEditor?.value.trim()) {
            setTextEditor(null);
            return;
        }

        const item = {
            type: "text",
            color,
            width: textSize,
            text: textEditor.value.trim(),
            points: [
                {
                    x: textEditor.x,
                    y: textEditor.y,
                },
            ],
        };

        strokesRef.current.push(item);

        publish({
            type: "whiteboard-item",
            item,
        });

        setTextEditor(null);

        redraw();
    };

    // ==========================================
    // CLEAR BOARD
    // ==========================================

    const clearBoard = () => {
        strokesRef.current = [];

        currentItemRef.current = null;

        redraw();

        publish({
            type: "whiteboard-clear",
        });
    };

    // ==========================================
    // CURSOR LEAVE
    // ==========================================

    const handlePointerLeave = () => {
        publish({
            type: "cursor-leave",
        });
    };

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="whiteboard-container">

            {/* ====================================
                WHITEBOARD
            ==================================== */}

            <div className="whiteboard-panel whiteboard-panel-canvas">

                {/* TOOLBAR */}

                <div className="toolbar">

                    <label>
                        Color:

                        <input
                            type="color"
                            value={color}
                            onChange={(event) =>
                                setColor(
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label>
                        Brush:

                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={lineWidth}
                            onChange={(event) =>
                                setLineWidth(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />
                    </label>

                    <label>
                        Text:

                        <input
                            type="range"
                            min="12"
                            max="64"
                            value={textSize}
                            onChange={(event) =>
                                setTextSize(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />
                    </label>

                    {/* DRAW */}

                    <button
                        className={
                            tool === "draw"
                                ? "active-tool"
                                : ""
                        }
                        onClick={() =>
                            setTool("draw")
                        }
                    >
                        🖊 Draw
                    </button>

                    {/* RECTANGLE */}

                    <button
                        className={
                            tool === "rectangle"
                                ? "active-tool"
                                : ""
                        }
                        onClick={() =>
                            setTool("rectangle")
                        }
                    >
                        ▭ Rectangle
                    </button>

                    {/* ERASER */}

                    <button
                        className={
                            tool === "eraser"
                                ? "active-tool"
                                : ""
                        }
                        onClick={() =>
                            setTool("eraser")
                        }
                    >
                        🧹 Eraser
                    </button>

                    {/* TEXT */}

                    <button
                        className={
                            tool === "text"
                                ? "active-tool"
                                : ""
                        }
                        onClick={() =>
                            setTool("text")
                        }
                    >
                        T Text
                    </button>

                    {/* CLEAR */}

                    <button
                        onClick={clearBoard}
                    >
                        🗑 Clear
                    </button>

                </div>

                {/* CANVAS */}

                <div className="canvas-area">

                    <canvas
                        ref={canvasRef}
                        className="whiteboard"
                        onPointerDown={
                            startDrawing
                        }
                        onPointerMove={
                            draw
                        }
                        onPointerUp={
                            stopDrawing
                        }
                        onPointerCancel={
                            stopDrawing
                        }
                        onPointerLeave={
                            handlePointerLeave
                        }
                        onClick={
                            openTextEditor
                        }
                    />

                    {/* ==================================
                        REMOTE CURSORS
                    ================================== */}

                    {Object.values(
                        remoteCursors
                    ).map((cursor) => (
                        <div
                            key={cursor.userId}
                            className="remote-cursor"
                            style={{
                                left: cursor.x,
                                top: cursor.y,
                                "--cursor-color":
                                    cursor.color,
                            }}
                        >
                            <div className="cursor-pointer">
                                ◆
                            </div>

                            <div className="cursor-label">
                                {cursor.userName}
                            </div>
                        </div>
                    ))}

                    {/* ==================================
                        TEXT INPUT
                    ================================== */}

                    {textEditor && (
                        <input
                            autoFocus
                            className="canvas-text-editor"
                            style={{
                                left: textEditor.x,
                                top:
                                    textEditor.y -
                                    textSize,
                                fontSize: textSize,
                            }}
                            placeholder="Type here"
                            value={
                                textEditor.value
                            }
                            onPointerDown={(event) =>
                                event.stopPropagation()
                            }
                            onChange={(event) =>
                                setTextEditor({
                                    ...textEditor,
                                    value:
                                        event.target
                                            .value,
                                })
                            }
                            onBlur={commitText}
                            onKeyDown={(event) => {
                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    commitText();
                                }

                                if (
                                    event.key ===
                                    "Escape"
                                ) {
                                    setTextEditor(
                                        null
                                    );
                                }
                            }}
                        />
                    )}

                </div>

            </div>

            {/* ====================================
                CODE EDITOR
            ==================================== */}

            <div className="whiteboard-panel whiteboard-panel-editor">

                <CodeEditor
                    roomId={roomId}
                />

            </div>

        </div>
    );
}

export default Whiteboard;

