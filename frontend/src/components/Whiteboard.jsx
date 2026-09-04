import { useEffect, useRef, useState } from "react";
import { useSyncSpaceStore } from "../store/syncSpaceStore";
import CodeEditor from "./CodeEditor";
import socket from "../socket";
import "./Whiteboard.css";

const TOOLS = [
    { id: "select", icon: "↖", label: "Select", key: "V" },
    { id: "draw", icon: "✎", label: "Pen", key: "P" },
    { id: "eraser", icon: "⌫", label: "Eraser", key: "E" },
    { id: "line", icon: "╱", label: "Line", key: "L" },
    { id: "arrow", icon: "→", label: "Arrow", key: "A" },
    { id: "rectangle", icon: "□", label: "Rect", key: "R" },
    { id: "circle", icon: "○", label: "Circle", key: "C" },
    { id: "text", icon: "T", label: "Text", key: "T" },
];

function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Whiteboard({ roomId, userName }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const currentItemRef = useRef(null);
    const strokesRef = useRef([]);

    const undoStackRef = useRef([]);
    const redoStackRef = useRef([]);

    const lastCursorPublishRef = useRef(0);

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

    const [textSize, setTextSize] = useState(24);
    const [textEditor, setTextEditor] = useState(null);
    const [remoteCursors, setRemoteCursors] = useState({});
    const [showHelp, setShowHelp] = useState(false);
    const [copied, setCopied] = useState(false);

    const userIdRef = useRef(
        localStorage.getItem("syncspace_user_id") ||
        createId()
    );

    const cursorColorRef = useRef(
        localStorage.getItem("syncspace_cursor_color") ||
        "#6366f1"
    );

    useEffect(() => {
        localStorage.setItem(
            "syncspace_user_id",
            userIdRef.current
        );

        localStorage.setItem(
            "syncspace_cursor_color",
            cursorColorRef.current
        );
    }, []);

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

    const getPosition = (event) => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return { x: 0, y: 0 };
        }

        const rect = canvas.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const drawItem = (item) => {
        const canvas = canvasRef.current;

        if (!canvas || !item) return;

        const context = canvas.getContext("2d");

        if (!context) return;

        context.save();

        context.fillStyle = item.color || "#111827";
        context.strokeStyle = item.color || "#111827";
        context.lineWidth = item.width || 3;
        context.lineCap = "round";
        context.lineJoin = "round";

        if (item.tool === "eraser") {
            context.globalCompositeOperation =
                "destination-out";
        } else {
            context.globalCompositeOperation =
                "source-over";
        }

        /*
         * TEXT
         */
        if (item.type === "text") {
            context.globalCompositeOperation =
                "source-over";

            context.font =
                `600 ${item.width || 24}px Inter, Arial, sans-serif`;

            context.fillText(
                item.text || "",
                item.points[0].x,
                item.points[0].y
            );

            context.restore();
            return;
        }

        /*
         * RECTANGLE
         */
        if (item.type === "rectangle") {
            const start = item.points[0];
            const end = item.points[item.points.length - 1];

            context.strokeRect(
                start.x,
                start.y,
                end.x - start.x,
                end.y - start.y
            );

            context.restore();
            return;
        }

        /*
         * CIRCLE
         */
        if (item.type === "circle") {
            const start = item.points[0];
            const end = item.points[item.points.length - 1];

            const width = end.x - start.x;
            const height = end.y - start.y;

            const radiusX = Math.abs(width) / 2;
            const radiusY = Math.abs(height) / 2;

            const centerX = start.x + width / 2;
            const centerY = start.y + height / 2;

            context.beginPath();

            context.ellipse(
                centerX,
                centerY,
                Math.max(radiusX, 1),
                Math.max(radiusY, 1),
                0,
                0,
                Math.PI * 2
            );

            context.stroke();

            context.restore();
            return;
        }

        /*
         * LINE
         */
        if (item.type === "line") {
            const start = item.points[0];
            const end = item.points[item.points.length - 1];

            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();

            context.restore();
            return;
        }

        /*
         * ARROW
         */
        if (item.type === "arrow") {
            const start = item.points[0];
            const end = item.points[item.points.length - 1];

            const angle = Math.atan2(
                end.y - start.y,
                end.x - start.x
            );

            const arrowSize = Math.max(
                8,
                (item.width || 3) * 3
            );

            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();

            context.beginPath();

            context.moveTo(
                end.x - arrowSize * Math.cos(angle - Math.PI / 6),
                end.y - arrowSize * Math.sin(angle - Math.PI / 6)
            );

            context.lineTo(end.x, end.y);

            context.lineTo(
                end.x - arrowSize * Math.cos(angle + Math.PI / 6),
                end.y - arrowSize * Math.sin(angle + Math.PI / 6)
            );

            context.stroke();

            context.restore();
            return;
        }

        /*
         * FREEHAND / ERASER
         */
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

    const redraw = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        if (!context) return;

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        strokesRef.current.forEach(drawItem);

        if (currentItemRef.current) {
            drawItem(currentItemRef.current);
        }
    };

    const saveHistory = () => {
        undoStackRef.current.push(
            JSON.stringify(strokesRef.current)
        );

        if (undoStackRef.current.length > 50) {
            undoStackRef.current.shift();
        }

        redoStackRef.current = [];
    };

    const undo = () => {
        if (strokesRef.current.length === 0) return;

        redoStackRef.current.push(
            JSON.stringify(strokesRef.current)
        );

        strokesRef.current.pop();

        redraw();
    };

    const redo = () => {
        const snapshot =
            redoStackRef.current.pop();

        if (!snapshot) return;

        undoStackRef.current.push(
            JSON.stringify(strokesRef.current)
        );

        strokesRef.current =
            JSON.parse(snapshot);

        redraw();
    };

    const clearBoard = () => {
        if (strokesRef.current.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Clear the entire whiteboard?"
        );

        if (!confirmed) return;

        saveHistory();

        strokesRef.current = [];
        currentItemRef.current = null;

        redraw();

        publish({
            type: "whiteboard-clear",
        });
    };

    /*
     * CANVAS RESIZE
     */
    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const resizeCanvas = () => {
            const rect =
                canvas.getBoundingClientRect();

            const dpr =
                window.devicePixelRatio || 1;

            canvas.width =
                Math.max(1, rect.width * dpr);

            canvas.height =
                Math.max(1, rect.height * dpr);

            canvas.style.width =
                `${rect.width}px`;

            canvas.style.height =
                `${rect.height}px`;

            const context =
                canvas.getContext("2d");

            if (!context) return;

            context.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );

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

    /*
     * SOCKET.IO EVENTS
     */
    useEffect(() => {
        if (!roomId) return;

        const handleWhiteboardEvent = (
            message
        ) => {
            if (!message) return;

            if (message.roomId !== roomId) {
                return;
            }

            if (
                message.userId ===
                userIdRef.current
            ) {
                return;
            }

            if (
                message.type ===
                "whiteboard-item"
            ) {
                if (!message.item) return;

                strokesRef.current.push(
                    message.item
                );

                redraw();

                return;
            }

            if (
                message.type ===
                "whiteboard-clear"
            ) {
                strokesRef.current = [];
                currentItemRef.current = null;

                redraw();

                return;
            }

            if (
                message.type ===
                "cursor-move"
            ) {
                setRemoteCursors(
                    (previous) => ({
                        ...previous,
                        [message.userId]: {
                            userId:
                                message.userId,
                            userName:
                                message.userName ||
                                "Guest",
                            color:
                                message.cursorColor ||
                                "#6366f1",
                            x: message.x,
                            y: message.y,
                            lastSeen:
                                Date.now(),
                        },
                    })
                );

                return;
            }

            if (
                message.type ===
                "cursor-leave"
            ) {
                setRemoteCursors(
                    (previous) => {
                        const next = {
                            ...previous,
                        };

                        delete next[
                            message.userId
                        ];

                        return next;
                    }
                );
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

    /*
     * REMOVE OLD REMOTE CURSORS
     */
    useEffect(() => {
        const interval = setInterval(() => {
            setRemoteCursors(
                (previous) => {
                    const now = Date.now();
                    const next = {};

                    Object.values(
                        previous
                    ).forEach((cursor) => {
                        if (
                            now -
                                cursor.lastSeen <
                            5000
                        ) {
                            next[
                                cursor.userId
                            ] = cursor;
                        }
                    });

                    return next;
                }
            );
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    /*
     * KEYBOARD SHORTCUTS
     */
    useEffect(() => {
        const handleKeyboard = (event) => {
            const target =
                event.target;

            if (
                target &&
                (
                    target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.tagName === "SELECT"
                )
            ) {
                return;
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "z"
            ) {
                event.preventDefault();

                if (event.shiftKey) {
                    redo();
                } else {
                    undo();
                }

                return;
            }

            const shortcut =
                event.key.toLowerCase();

            const found =
                TOOLS.find(
                    (item) =>
                        item.key.toLowerCase() ===
                        shortcut
                );

            if (found) {
                event.preventDefault();
                setTool(found.id);
            }

            if (event.key === "?") {
                setShowHelp(
                    (previous) => !previous
                );
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyboard
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyboard
            );
        };
    }, [setTool]);

    /*
     * DRAWING
     */
    const startDrawing = (event) => {
        if (tool === "text") return;

        event.currentTarget.setPointerCapture?.(
            event.pointerId
        );

        const point = getPosition(event);

        drawingRef.current = true;

        saveHistory();

        if (
            tool === "line" ||
            tool === "arrow" ||
            tool === "rectangle" ||
            tool === "circle"
        ) {
            currentItemRef.current = {
                id: createId(),
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

        currentItemRef.current = {
            id: createId(),
            type: "stroke",
            tool,
            color,
            width: lineWidth,
            points: [point],
        };

        redraw();
    };

    const draw = (event) => {
        if (!roomId) return;

        const now = Date.now();

        if (
            now -
                lastCursorPublishRef.current >
            40
        ) {
            const point =
                getPosition(event);

            publish({
                type: "cursor-move",
                x: point.x,
                y: point.y,
            });

            lastCursorPublishRef.current =
                now;
        }

        if (!drawingRef.current) {
            return;
        }

        const point = getPosition(event);

        const item =
            currentItemRef.current;

        if (!item) return;

        if (
            item.type === "line" ||
            item.type === "arrow" ||
            item.type === "rectangle" ||
            item.type === "circle"
        ) {
            item.points[1] = point;

            redraw();

            return;
        }

        item.points.push(point);

        redraw();
    };

    const stopDrawing = (event) => {
        if (!drawingRef.current) {
            return;
        }

        const item =
            currentItemRef.current;

        if (
            item &&
            (
                item.points.length > 1 ||
                item.type !== "stroke"
            )
        ) {
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

    /*
     * TEXT
     */
    const openTextEditor = (event) => {
        if (
            tool !== "text" ||
            textEditor
        ) {
            return;
        }

        const point =
            getPosition(event);

        setTextEditor({
            ...point,
            value: "",
        });
    };

    const commitText = () => {
        if (
            !textEditor?.value.trim()
        ) {
            setTextEditor(null);
            return;
        }

        saveHistory();

        const item = {
            id: createId(),
            type: "text",
            color,
            width: textSize,
            text:
                textEditor.value.trim(),
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

    /*
     * COPY ROOM LINK
     */
    const copyRoomLink = async () => {
        const link =
            `${window.location.origin}/room/${roomId}`;

        try {
            await navigator.clipboard.writeText(
                link
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1800);
        } catch {
            window.prompt(
                "Copy this room link:",
                link
            );
        }
    };

    const remoteCount =
        Object.keys(remoteCursors).length;

    const displayName =
        userName ||
        localStorage.getItem(
            "syncspace_name"
        ) ||
        "Guest";

    return (
        <div className="syncspace">
            {/* =====================================
                TOP BAR
            ====================================== */}

            <header className="topbar">
                <div className="brand">
                    <div className="brand-mark">
                        S
                    </div>

                    <div className="brand-copy">
                        <div className="brand-name">
                            Sync<span>Space</span>
                        </div>

                        <div className="brand-tagline">
                            INTERVIEW WORKSPACE
                        </div>
                    </div>
                </div>

                <div className="workspace-title">
                    <span className="workspace-title-dot" />
                    Collaborative Whiteboard

                    <span className="live-pill">
                        <span />
                        Live workspace
                    </span>
                </div>

                <div className="topbar-right">
                    <div className="online-users">
                        <div className="avatar-stack">
                            <span className="avatar primary">
                                {displayName
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>

                            {remoteCount > 0 &&
                                Array.from({
                                    length:
                                        Math.min(
                                            remoteCount,
                                            3
                                        ),
                                }).map(
                                    (_, index) => (
                                        <span
                                            className="avatar"
                                            key={
                                                index
                                            }
                                        >
                                            {String.fromCharCode(
                                                65 +
                                                    index
                                            )}
                                        </span>
                                    )
                                )}
                        </div>

                        <span>
                            {remoteCount + 1} online
                        </span>
                    </div>

                    <button
                        type="button"
                        className="room-button"
                        onClick={
                            copyRoomLink
                        }
                        title="Copy room link"
                    >
                        <span>
                            ROOM
                        </span>

                        {roomId ||
                            "ROOM"}
                    </button>

                    <button
                        type="button"
                        className="share-button"
                        onClick={
                            copyRoomLink
                        }
                    >
                        {copied
                            ? "✓ Copied"
                            : "↗ Share"}
                    </button>
                </div>
            </header>

            {/* =====================================
                WORKSPACE
            ====================================== */}

            <main className="workspace">
                {/* =================================
                    TOOL PANEL
                ================================== */}

                <aside className="tool-panel">
                    <div className="tool-panel-label">
                        TOOLS
                    </div>

                    <div className="tool-list">
                        {TOOLS.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                className={`tool-button ${
                                    tool === item.id
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setTool(
                                        item.id
                                    )
                                }
                                title={`${item.label} (${item.key})`}
                            >
                                <span className="tool-icon">
                                    {item.icon}
                                </span>

                                <span className="tool-label">
                                    {item.label}
                                </span>

                                <span className="tool-key">
                                    {item.key}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="tool-divider" />

                    <button
                        type="button"
                        className="side-action"
                        onClick={undo}
                        disabled={
                            strokesRef.current
                                .length === 0
                        }
                        title="Undo (Ctrl + Z)"
                    >
                        ↶
                    </button>

                    <button
                        type="button"
                        className="side-action"
                        onClick={redo}
                        disabled={
                            redoStackRef.current
                                .length === 0
                        }
                        title="Redo (Ctrl + Shift + Z)"
                    >
                        ↷
                    </button>

                    <button
                        type="button"
                        className="side-action danger"
                        onClick={clearBoard}
                        title="Clear board"
                    >
                        ⌫
                    </button>

                    <div className="tool-spacer" />

                    <button
                        type="button"
                        className="help-button"
                        onClick={() =>
                            setShowHelp(
                                (previous) =>
                                    !previous
                            )
                        }
                        title="Keyboard shortcuts"
                    >
                        ?
                    </button>
                </aside>

                {/* =================================
                    CANVAS
                ================================== */}

                <section className="canvas-section">
                    <div className="canvas-header">
                        <div>
                            <div className="canvas-kicker">
                                SHARED CANVAS
                            </div>

                            <div className="canvas-heading">
                                Whiteboard
                            </div>
                        </div>

                        <div className="canvas-actions">
                            <span className="connection-status">
                                <span />
                                Connected
                            </span>

                            <span className="room-chip">
                                #{roomId || "room"}
                            </span>
                        </div>
                    </div>

                    <div className="canvas-area">
                        <div className="canvas-wrapper">
                            <div className="canvas-grid" />

                            <div className="live-badge">
                                <span className="live-dot" />
                                Live canvas
                            </div>

                            <div className="canvas-hint">
                                <strong>
                                    {tool === "select"
                                        ? "Select tool"
                                        : `${tool.charAt(0).toUpperCase()}${tool.slice(1)} tool`}
                                </strong>

                                <span>
                                    Draw and collaborate in
                                    real time
                                </span>
                            </div>

                            <canvas
                                ref={canvasRef}
                                className={`drawing-canvas cursor-${tool}`}
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
                                onPointerLeave={() => {
                                    publish({
                                        type:
                                            "cursor-leave",
                                    });
                                }}
                                onClick={
                                    openTextEditor
                                }
                            />

                            {/* REMOTE CURSORS */}

                            {Object.values(
                                remoteCursors
                            ).map(
                                (cursor) => (
                                    <div
                                        key={
                                            cursor.userId
                                        }
                                        className="remote-cursor"
                                        style={{
                                            left:
                                                cursor.x,
                                            top:
                                                cursor.y,
                                            "--cursor-color":
                                                cursor.color,
                                        }}
                                    >
                                        <div className="cursor-pointer">
                                            ◆
                                        </div>

                                        <div className="cursor-label">
                                            {
                                                cursor.userName
                                            }
                                        </div>
                                    </div>
                                )
                            )}

                            {/* TEXT INPUT */}

                            {textEditor && (
                                <div
                                    className="canvas-text-editor"
                                    style={{
                                        left:
                                            textEditor.x,
                                        top:
                                            textEditor.y -
                                            textSize,
                                    }}
                                >
                                    <input
                                        autoFocus
                                        value={
                                            textEditor.value
                                        }
                                        placeholder="Type your text..."
                                        style={{
                                            fontSize:
                                                textSize,
                                        }}
                                        onPointerDown={(
                                            event
                                        ) =>
                                            event.stopPropagation()
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setTextEditor(
                                                {
                                                    ...textEditor,
                                                    value:
                                                        event
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        onBlur={
                                            commitText
                                        }
                                        onKeyDown={(
                                            event
                                        ) => {
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
                                </div>
                            )}

                            {/* SHORTCUT HELP */}

                            {showHelp && (
                                <div className="shortcut-panel">
                                    <div className="shortcut-header">
                                        <div>
                                            <span>
                                                SHORTCUTS
                                            </span>

                                            <strong>
                                                Keyboard controls
                                            </strong>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowHelp(
                                                    false
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="shortcut-grid">
                                        {TOOLS.map(
                                            (
                                                item
                                            ) => (
                                                <div
                                                    key={
                                                        item.id
                                                    }
                                                >
                                                    <kbd>
                                                        {
                                                            item.key
                                                        }
                                                    </kbd>

                                                    <span>
                                                        {
                                                            item.label
                                                        }
                                                    </span>
                                                </div>
                                            )
                                        )}

                                        <div>
                                            <kbd>
                                                Ctrl Z
                                            </kbd>

                                            <span>
                                                Undo
                                            </span>
                                        </div>

                                        <div>
                                            <kbd>
                                                Ctrl ⇧ Z
                                            </kbd>

                                            <span>
                                                Redo
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =================================
                        BOTTOM CONTROLS
                    ================================== */}

                    <footer className="bottom-bar">
                        <div className="bottom-group">
                            <span className="bottom-label">
                                Color
                            </span>

                            <input
                                className="color-picker"
                                type="color"
                                value={color}
                                onChange={(event) =>
                                    setColor(
                                        event.target.value
                                    )
                                }
                                title="Choose color"
                            />

                            <span className="color-value">
                                {color.toUpperCase()}
                            </span>
                        </div>

                        <div className="bottom-separator" />

                        <div className="bottom-group slider-group">
                            <span className="bottom-label">
                                Brush
                            </span>

                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={lineWidth}
                                onChange={(event) =>
                                    setLineWidth(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                            />

                            <span className="slider-value">
                                {lineWidth}px
                            </span>
                        </div>

                        <div className="bottom-group slider-group">
                            <span className="bottom-label">
                                Text
                            </span>

                            <input
                                type="range"
                                min="12"
                                max="64"
                                value={textSize}
                                onChange={(event) =>
                                    setTextSize(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                            />

                            <span className="slider-value">
                                {textSize}px
                            </span>
                        </div>

                        <div className="bottom-spacer" />

                        <div className="board-info">
                            <span className="board-info-dot" />
                            Changes sync automatically
                        </div>

                        <button
                            type="button"
                            className="zoom-button"
                            onClick={() =>
                                setShowHelp(
                                    (previous) =>
                                        !previous
                                )
                            }
                        >
                            ?
                        </button>
                    </footer>
                </section>

                {/* =================================
                    CODE EDITOR
                ================================== */}

                <section className="editor-section">
                    <CodeEditor
                        roomId={roomId}
                    />
                </section>
            </main>
        </div>
    );
}

export default Whiteboard;