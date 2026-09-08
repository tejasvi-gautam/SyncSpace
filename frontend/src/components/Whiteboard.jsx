
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
    const historyRef = useRef({
        past: [],
        future: [],
    });
    const viewportRef = useRef({
        x: 0,
        y: 0,
        zoom: 1,
    });

    const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

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
    // UNDO / REDO
    // ==========================================

    const saveHistory = () => {
        historyRef.current.past.push(
            JSON.parse(JSON.stringify(strokesRef.current))
        );
        historyRef.current.future = [];
    };

    const undo = () => {
        if (historyRef.current.past.length === 0) return;

        historyRef.current.future.push(
            JSON.parse(JSON.stringify(strokesRef.current))
        );
        strokesRef.current = historyRef.current.past.pop();

        publish({
            type: "whiteboard-clear",
        });

        strokesRef.current.forEach((item) => {
            publish({
                type: "whiteboard-item",
                item,
            });
        });

        redraw();
    };

    const redo = () => {
        if (historyRef.current.future.length === 0) return;

        historyRef.current.past.push(
            JSON.parse(JSON.stringify(strokesRef.current))
        );
        strokesRef.current = historyRef.current.future.pop();

        publish({
            type: "whiteboard-clear",
        });

        strokesRef.current.forEach((item) => {
            publish({
                type: "whiteboard-item",
                item,
            });
        });

        redraw();
    };

    // ==========================================
    // FIT TO SCREEN
    // ==========================================

    const fitToScreen = () => {
        if (strokesRef.current.length === 0) {
            // Reset to center
            viewportRef.current.x = 0;
            viewportRef.current.y = 0;
            viewportRef.current.zoom = 1;
            redraw();
            return;
        }

        // Find bounding box of all strokes
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        strokesRef.current.forEach((item) => {
            if (item.points && item.points.length > 0) {
                item.points.forEach((point) => {
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minY = Math.min(minY, point.y);
                    maxY = Math.max(maxY, point.y);
                });
            }
        });

        if (minX === Infinity) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const padding = 40;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;

        const scaleX = canvas.width / contentWidth;
        const scaleY = canvas.height / contentHeight;
        const scale = Math.min(scaleX, scaleY, 2); // Max zoom 2x

        viewportRef.current.zoom = scale;
        viewportRef.current.x = -minX * scale + padding;
        viewportRef.current.y = -minY * scale + padding;

        redraw();
    };

    // ==========================================
    // VIEWPORT HELPERS
    // ==========================================

    const toScreenPoint = (point) => {
        const { x, y } = viewportRef.current;
        const { zoom } = viewportRef.current;

        return {
            x: point.x * zoom + x,
            y: point.y * zoom + y,
        };
    };

    const fromScreenPoint = (point) => {
        const { x, y, zoom } = viewportRef.current;

        return {
            x: (point.x - x) / zoom,
            y: (point.y - y) / zoom,
        };
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
        // RECTANGLE / CIRCLE / SHAPES
        // ======================================

        if (
            item.type === "rectangle" ||
            item.type === "circle" ||
            item.type === "triangle" ||
            item.type === "diamond"
        ) {
            context.globalCompositeOperation = "source-over";
            const start = item.points[0];
            const end = item.points[item.points.length - 1];
            const width = end.x - start.x;
            const height = end.y - start.y;

            if (item.type === "rectangle") {
                context.strokeRect(start.x, start.y, width, height);
            } else if (item.type === "circle") {
                const radius = Math.sqrt(width * width + height * height) / 2;
                context.beginPath();
                context.arc(start.x + width / 2, start.y + height / 2, radius, 0, Math.PI * 2);
                context.stroke();
            } else if (item.type === "triangle") {
                context.beginPath();
                context.moveTo(start.x + width / 2, start.y);
                context.lineTo(start.x, start.y + height);
                context.lineTo(start.x + width, start.y + height);
                context.closePath();
                context.stroke();
            } else if (item.type === "diamond") {
                context.beginPath();
                context.moveTo(start.x + width / 2, start.y);
                context.lineTo(start.x + width, start.y + height / 2);
                context.lineTo(start.x + width / 2, start.y + height);
                context.lineTo(start.x, start.y + height / 2);
                context.closePath();
                context.stroke();
            }

            context.restore();
            return;
        }

        // ======================================
        // LINE
        // ======================================

        if (item.type === "line") {
            context.globalCompositeOperation = "source-over";
            context.beginPath();
            context.moveTo(item.points[0].x, item.points[0].y);
            context.lineTo(
                item.points[item.points.length - 1].x,
                item.points[item.points.length - 1].y
            );
            context.stroke();
            context.restore();
            return;
        }

        // ======================================
        // ARROW
        // ======================================

        if (item.type === "arrow") {
            context.globalCompositeOperation = "source-over";
            const start = item.points[0];
            const end = item.points[item.points.length - 1];
            const headlen = 15;
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            // Draw line
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();

            // Draw arrowhead
            context.beginPath();
            context.moveTo(end.x, end.y);
            context.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
            context.moveTo(end.x, end.y);
            context.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
            context.stroke();

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

        context.save();
        context.translate(
            viewportRef.current.x,
            viewportRef.current.y
        );
        context.scale(
            viewportRef.current.zoom,
            viewportRef.current.zoom
        );

        strokesRef.current.forEach(drawItem);

        if (currentItemRef.current) {
            drawItem(currentItemRef.current);
        }

        context.restore();
    };

    // ==========================================
    // CANVAS SIZE
    // ==========================================

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();

            canvas.width = rect.width;
            canvas.height = rect.height;

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
    // KEYBOARD SHORTCUTS
    // ==========================================

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl+Z or Cmd+Z for undo
            if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
                event.preventDefault();
                undo();
            }
            // Ctrl+Y or Cmd+Y for redo, or Ctrl+Shift+Z
            else if (
                ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey)))
            ) {
                event.preventDefault();
                redo();
            }
            // Spacebar for pan mode
            else if (event.code === "Space") {
                event.preventDefault();
                setTool("pan");
            }
        };

        const handleKeyUp = (event) => {
            // Release pan mode when spacebar is released
            if (event.code === "Space" && tool === "pan") {
                setTool("draw");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [tool]);

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

    const getWorldPosition = (event) => {
        const point = getPosition(event);
        return fromScreenPoint(point);
    };

    // ==========================================
    // SEND CURSOR POSITION
    // ==========================================

    const sendCursorPosition = (event) => {
        if (!roomId) return;

        const point = getWorldPosition(event);

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
        if (tool === "text" || tool === "select") return;

        if (tool === "pan") {
            setIsPanning(true);
            panStartRef.current = getPosition(event);
            return;
        }

        event.currentTarget.setPointerCapture?.(
            event.pointerId
        );

        const point = getWorldPosition(event);
        saveHistory();
        drawingRef.current = true;

        // ======================================
        // SHAPES
        // ======================================

        if (
            tool === "rectangle" ||
            tool === "circle" ||
            tool === "triangle" ||
            tool === "diamond" ||
            tool === "line" ||
            tool === "arrow"
        ) {
            currentItemRef.current = {
                type: tool,
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

        if (tool === "pan" && isPanning) {
            const currentPos = getPosition(event);
            const deltaX = currentPos.x - panStartRef.current.x;
            const deltaY = currentPos.y - panStartRef.current.y;

            viewportRef.current.x += deltaX;
            viewportRef.current.y += deltaY;

            panStartRef.current = currentPos;
            redraw();
            return;
        }

        if (!drawingRef.current) {
            return;
        }

        const point = getWorldPosition(event);
        const item = currentItemRef.current;

        if (!item) return;

        // ======================================
        // SHAPES (rectangle, circle, line, arrow, etc)
        // ======================================

        if (
            item.type === "rectangle" ||
            item.type === "circle" ||
            item.type === "triangle" ||
            item.type === "diamond" ||
            item.type === "line" ||
            item.type === "arrow"
        ) {
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
        if (tool === "pan") {
            setIsPanning(false);
            return;
        }

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

        const point = getWorldPosition(event);

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

    const handleWheel = (event) => {
        event.preventDefault();

        const canvas = canvasRef.current;

        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;

        const currentZoom = viewportRef.current.zoom;
        const nextZoom = Math.min(
            2.5,
            Math.max(0.4, currentZoom + (event.deltaY > 0 ? -0.1 : 0.1))
        );

        const worldX =
            (pointerX - viewportRef.current.x) / currentZoom;
        const worldY =
            (pointerY - viewportRef.current.y) / currentZoom;

        viewportRef.current.zoom = nextZoom;
        viewportRef.current.x = pointerX - worldX * nextZoom;
        viewportRef.current.y = pointerY - worldY * nextZoom;

        redraw();
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

                    {/* LINE */}

                    <button
                        className={
                            tool === "line"
                                ? "active-tool"
                                : ""
                        }
                        onClick={() =>
                            setTool("line")
                        }
                    >
                        ➖ Line
                    </button>

                    {/* ARROW */}

                    <button
                        className={
                            tool === "arrow"
                                ? "active-tool"
                                : ""
                        }
                        onClick={() =>
                            setTool("arrow")
                        }
                    >
                        ➡️ Arrow
                    </button>

                    {/* SHAPES MENU */}

                    <div style={{ position: "relative" }}>
                        <button
                            className={
                                [
                                    "rectangle",
                                    "circle",
                                    "triangle",
                                    "diamond",
                                ].includes(tool)
                                    ? "active-tool"
                                    : ""
                            }
                            onClick={() =>
                                setShapeMenuOpen(
                                    !shapeMenuOpen
                                )
                            }
                        >
                            🔷 Shapes
                        </button>

                        {shapeMenuOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    background: "white",
                                    border: "1px solid #dbe1ea",
                                    borderRadius: "8px",
                                    zIndex: 100,
                                    minWidth: "120px",
                                }}
                            >
                                <button
                                    onClick={() => {
                                        setTool("rectangle");
                                        setShapeMenuOpen(false);
                                    }}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    ▭ Rectangle
                                </button>
                                <button
                                    onClick={() => {
                                        setTool("circle");
                                        setShapeMenuOpen(false);
                                    }}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    ● Circle
                                </button>
                                <button
                                    onClick={() => {
                                        setTool("triangle");
                                        setShapeMenuOpen(false);
                                    }}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    △ Triangle
                                </button>
                                <button
                                    onClick={() => {
                                        setTool("diamond");
                                        setShapeMenuOpen(false);
                                    }}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    ◇ Diamond
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PAN */}

                    <button
                        className={
                            tool === "pan"
                                ? "active-tool"
                                : ""
                        }
                        onClick={() =>
                            setTool("pan")
                        }
                        title="Hold spacebar to pan"
                    >
                        ✋ Pan
                    </button>

                    {/* UNDO / REDO */}

                    <button
                        onClick={undo}
                        title="Undo (Ctrl+Z)"
                    >
                        ↶ Undo
                    </button>

                    <button
                        onClick={redo}
                        title="Redo (Ctrl+Y)"
                    >
                        ↷ Redo
                    </button>

                    {/* FIT TO SCREEN */}

                    <button
                        onClick={fitToScreen}
                        title="Fit all content to screen"
                    >
                        ⛶ Fit
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
                        style={{
                            cursor: tool === "pan" ? "grab" : "default",
                        }}
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
                        onWheel={handleWheel}
                        onClick={
                            openTextEditor
                        }
                    />

                    {/* ==================================
                        REMOTE CURSORS
                    ================================== */}

                    {Object.values(
                        remoteCursors
                    ).map((cursor) => {
                        const remotePosition = toScreenPoint(cursor);

                        return (
                            <div
                                key={cursor.userId}
                                className="remote-cursor"
                                style={{
                                    left: remotePosition.x,
                                    top: remotePosition.y,
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
                        );
                    })}

                    {/* ==================================
                        TEXT INPUT
                    ================================== */}

                    {textEditor && (
                        <input
                            autoFocus
                            className="canvas-text-editor"
                            style={{
                                left: toScreenPoint({
                                    x: textEditor.x,
                                    y: textEditor.y,
                                }).x,
                                top:
                                    toScreenPoint({
                                        x: textEditor.x,
                                        y: textEditor.y,
                                    }).y -
                                    textSize *
                                        viewportRef.current.zoom,
                                fontSize:
                                    textSize *
                                    viewportRef.current.zoom,
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

