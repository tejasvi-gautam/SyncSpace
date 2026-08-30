import { useEffect, useRef, useState } from "react";
import { useSyncSpaceStore } from "../store/syncSpaceStore";
import CodeEditor from "./CodeEditor";
import "./Whiteboard.css";

function Whiteboard({ roomId }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const strokesRef = useRef([]);
    const channelRef = useRef(null);

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

    // ==========================================
    // BROADCAST MESSAGE
    // ==========================================

    const publish = (message) => {
        channelRef.current?.postMessage(message);
    };

    // ==========================================
    // DRAW ITEM
    // ==========================================

    const drawItem = (item) => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        context.fillStyle = item.color;
        context.strokeStyle = item.color;
        context.lineWidth = item.width;
        context.lineCap = "round";
        context.lineJoin = "round";

        // Draw text
        if (item.type === "text") {
            context.font = `${item.width}px sans-serif`;

            context.fillText(
                item.text,
                item.points[0].x,
                item.points[0].y
            );

            return;
        }

        // Eraser
        context.globalCompositeOperation =
            item.tool === "eraser"
                ? "destination-out"
                : "source-over";

        context.beginPath();

        context.moveTo(
            item.points[0].x,
            item.points[0].y
        );

        item.points
            .slice(1)
            .forEach((point) => {
                context.lineTo(point.x, point.y);
            });

        context.stroke();
        context.closePath();

        context.globalCompositeOperation = "source-over";
    };

    // ==========================================
    // REDRAW CANVAS
    // ==========================================

    const redraw = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        context.clearRect(
            0,
            0,
            canvas.clientWidth,
            canvas.clientHeight
        );

        strokesRef.current.forEach(drawItem);
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
    // REAL-TIME ROOM CONNECTION
    // ==========================================

    useEffect(() => {
        if (
            !roomId ||
            typeof BroadcastChannel === "undefined"
        ) {
            return undefined;
        }

        const channel = new BroadcastChannel(
            `syncspace-room-${roomId}`
        );

        channelRef.current = channel;

        channel.onmessage = (event) => {
            const message = event.data;

            // Receive new drawing
            if (message.type === "whiteboard-item") {
                strokesRef.current.push(
                    message.item
                );

                redraw();
            }

            // Clear board
            if (message.type === "whiteboard-clear") {
                strokesRef.current = [];

                redraw();
            }

            // Request current board
            if (
                message.type ===
                "whiteboard-sync-request"
            ) {
                channel.postMessage({
                    type: "whiteboard-sync-state",
                    items: strokesRef.current,
                });
            }

            // Receive current board
            if (
                message.type ===
                    "whiteboard-sync-state" &&
                strokesRef.current.length === 0
            ) {
                strokesRef.current =
                    message.items;

                redraw();
            }
        };

        channel.postMessage({
            type: "whiteboard-sync-request",
        });

        return () => {
            channel.close();
            channelRef.current = null;
        };
    }, [roomId]);

    // ==========================================
    // GET MOUSE POSITION
    // ==========================================

    const getPosition = (event) => {
        const canvas = canvasRef.current;

        const rect =
            canvas.getBoundingClientRect();

        const point =
            event.clientX === undefined
                ? event.touches[0]
                : event;

        return {
            x: point.clientX - rect.left,
            y: point.clientY - rect.top,
        };
    };

    // ==========================================
    // START DRAWING
    // ==========================================

    const startDrawing = (event) => {
        if (tool === "text") {
            return;
        }

        event.currentTarget.setPointerCapture?.(
            event.pointerId
        );

        drawingRef.current = true;

        strokesRef.current.push({
            type: "stroke",
            tool: tool,
            color: color,
            width: lineWidth,
            points: [getPosition(event)],
        });
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
    // DRAW
    // ==========================================

    const draw = (event) => {
        if (!drawingRef.current) {
            return;
        }

        strokesRef.current
            .at(-1)
            .points.push(
                getPosition(event)
            );

        redraw();
    };

    // ==========================================
    // STOP DRAWING
    // ==========================================

    const stopDrawing = () => {
        if (drawingRef.current) {
            publish({
                type: "whiteboard-item",
                item: strokesRef.current.at(-1),
            });
        }

        drawingRef.current = false;
    };

    // ==========================================
    // ADD TEXT
    // ==========================================

    const commitText = () => {
        if (!textEditor?.value.trim()) {
            setTextEditor(null);
            return;
        }

        strokesRef.current.push({
            type: "text",
            color: color,
            width: textSize,
            text: textEditor.value.trim(),
            points: [
                {
                    x: textEditor.x,
                    y: textEditor.y,
                },
            ],
        });

        publish({
            type: "whiteboard-item",
            item: strokesRef.current.at(-1),
        });

        setTextEditor(null);

        redraw();
    };

    // ==========================================
    // CLEAR BOARD
    // ==========================================

    const clearBoard = () => {
        const canvas = canvasRef.current;

        const context =
            canvas.getContext("2d");

        strokesRef.current = [];

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        publish({
            type: "whiteboard-clear",
        });

        context.globalCompositeOperation =
            "source-over";
    };

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="whiteboard-container">
            <div className="whiteboard-panel whiteboard-panel-canvas">
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
                        Brush Size:
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
                        Text Size:
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
                        Eraser
                    </button>

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
                        Text
                    </button>

                    <button onClick={clearBoard}>
                        🗑 Clear Board
                    </button>
                </div>

                <div className="canvas-area">
                    <canvas
                        ref={canvasRef}
                        className="whiteboard"
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerCancel={stopDrawing}
                        onClick={openTextEditor}
                    />

                    {textEditor && (
                        <input
                            autoFocus
                            className="canvas-text-editor"
                            style={{
                                left: textEditor.x,
                                top:
                                    textEditor.y -
                                    textSize,
                            }}
                            placeholder="Type here"
                            value={textEditor.value}
                            onPointerDown={(event) =>
                                event.stopPropagation()
                            }
                            onChange={(event) =>
                                setTextEditor({
                                    ...textEditor,
                                    value:
                                        event.target.value,
                                })
                            }
                            onBlur={commitText}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter"
                                ) {
                                    commitText();
                                }

                                if (
                                    event.key === "Escape"
                                ) {
                                    setTextEditor(null);
                                }
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="whiteboard-panel whiteboard-panel-editor">
                <CodeEditor roomId={roomId} />
            </div>
        </div>
    );
}

export default Whiteboard;