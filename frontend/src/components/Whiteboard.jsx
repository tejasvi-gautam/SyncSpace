import CodeEditor from "./CodeEditor";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { useParams } from "react-router-dom";

import { useSyncSpaceStore } from "../store/syncSpaceStore";
import socket from "../socket";

function Whiteboard() {
    // =====================================================
    // ROOM
    // =====================================================

    const { roomId } = useParams();

    const canvasRef = useRef(null);

    const objectsRef = useRef([]);
    const historyRef = useRef([[]]);
    const historyIndexRef = useRef(0);

    const drawingRef = useRef(false);
    const currentObjectRef = useRef(null);
    const selectedObjectRef = useRef(null);
    const dragOffsetRef = useRef(null);
    const resizeHandleRef = useRef(null);

    const [selectedObjectId, setSelectedObjectId] =
        useState(null);

    const [textEditor, setTextEditor] =
        useState(null);

    const [stickyEditor, setStickyEditor] =
        useState(null);

    const [historyVersion, setHistoryVersion] =
        useState(0);
    

    const [showUserRoster, setShowUserRoster] =
        useState(false);

    // =====================================================
    // CODE EDITOR STATE
    // =====================================================

    const [code, setCode] = useState("");

    const [language, setLanguage] =
        useState("JavaScript");

    const [codeSaved, setCodeSaved] =
        useState(false);

    const [isCodeOpen, setIsCodeOpen] =
        useState(false);

    const [codePanelWidth, setCodePanelWidth] =
        useState(430);

    const codeResizeRef = useRef(false);

    // =====================================================
    // CURRENT USER
    // =====================================================

    const [currentUser] = useState(() => {
        const name =
            localStorage.getItem(
                "syncspace_username"
            ) || "You";

        const role =
            localStorage.getItem(
                "syncspace_role"
            ) || "Collaborator";

        return {
            name,
            role,
        };
    });

    const [activeUsers, setActiveUsers] =
        useState([]);

    // =====================================================
    // STORE
    // =====================================================

    const tool = useSyncSpaceStore(
        (state) => state.selectedTool
    );

    const setTool = useSyncSpaceStore(
        (state) => state.setSelectedTool
    );

    const color = useSyncSpaceStore(
        (state) => state.selectedColor
    );

    const setColor = useSyncSpaceStore(
        (state) => state.setSelectedColor
    );

    const brushSize = useSyncSpaceStore(
        (state) => state.brushSize
    );

    const setBrushSize = useSyncSpaceStore(
        (state) => state.setBrushSize
    );

    const textSize = useSyncSpaceStore(
        (state) => state.textSize
    );

    const setTextSize = useSyncSpaceStore(
        (state) => state.setTextSize
    );

    const zoom = useSyncSpaceStore(
        (state) => state.zoom
    );

    const zoomIn = useSyncSpaceStore(
        (state) => state.zoomIn
    );

    const zoomOut = useSyncSpaceStore(
        (state) => state.zoomOut
    );

    const resetZoom = useSyncSpaceStore(
        (state) => state.resetZoom
    );

    const showGrid = useSyncSpaceStore(
        (state) => state.showGrid
    );

    const toggleGrid = useSyncSpaceStore(
        (state) => state.toggleGrid
    );

    // =====================================================
    // REFRESH
    // =====================================================

    const refresh = useCallback(() => {
        setHistoryVersion(
            (value) => value + 1
        );
    }, []);

    // =====================================================
    // ID
    // =====================================================

    const createId = () => {
        return `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`;
    };

    // =====================================================
    // SOCKET PUBLISH
    // =====================================================

    const publishWhiteboardObject =
        useCallback(
            (object) => {
                if (
                    !socket.connected ||
                    !roomId
                ) {
                    return;
                }

                socket.emit(
                    "whiteboard-event",
                    {
                        roomId,
                        type:
                            "whiteboard-object",
                        item: object,
                    }
                );
            },
            [roomId]
        );

    const publishWhiteboardState =
        useCallback(
            (objects) => {
                if (
                    !socket.connected ||
                    !roomId
                ) {
                    return;
                }

                socket.emit(
                    "whiteboard-event",
                    {
                        roomId,
                        type:
                            "whiteboard-state",
                        item: objects,
                    }
                );
            },
            [roomId]
        );

    // =====================================================
    // HISTORY
    // =====================================================

    const saveHistory = useCallback(() => {
        const snapshot = JSON.parse(
            JSON.stringify(
                objectsRef.current
            )
        );

        const index =
            historyIndexRef.current;

        historyRef.current =
            historyRef.current.slice(
                0,
                index + 1
            );

        historyRef.current.push(
            snapshot
        );

        historyIndexRef.current =
            historyRef.current.length - 1;

        refresh();
    }, [refresh]);

    // =====================================================
    // DRAW OBJECT
    // =====================================================

    const drawObject = useCallback(
        (context, object) => {
            if (!object) {
                return;
            }

            context.save();

            context.lineWidth =
                object.width || 3;

            context.strokeStyle =
                object.color || "#111827";

            context.fillStyle =
                object.fill ||
                "transparent";

            context.lineCap = "round";
            context.lineJoin = "round";

            if (object.type === "stroke") {
                const points =
                    object.points || [];

                if (!points.length) {
                    context.restore();
                    return;
                }

                if (
                    object.tool ===
                    "eraser"
                ) {
                    context.globalCompositeOperation =
                        "destination-out";
                }

                context.beginPath();

                context.moveTo(
                    points[0].x,
                    points[0].y
                );

                for (
                    let i = 1;
                    i < points.length;
                    i++
                ) {
                    context.lineTo(
                        points[i].x,
                        points[i].y
                    );
                }

                context.stroke();

                context.restore();
                return;
            }

            if (object.type === "line") {
                context.beginPath();

                context.moveTo(
                    object.x1,
                    object.y1
                );

                context.lineTo(
                    object.x2,
                    object.y2
                );

                context.stroke();

                context.restore();
                return;
            }

            if (object.type === "arrow") {
                const angle =
                    Math.atan2(
                        object.y2 -
                            object.y1,
                        object.x2 -
                            object.x1
                    );

                const headLength =
                    12 +
                    (object.width || 3);

                context.beginPath();

                context.moveTo(
                    object.x1,
                    object.y1
                );

                context.lineTo(
                    object.x2,
                    object.y2
                );

                context.stroke();

                context.beginPath();

                context.moveTo(
                    object.x2,
                    object.y2
                );

                context.lineTo(
                    object.x2 -
                        headLength *
                            Math.cos(
                                angle -
                                    Math.PI / 6
                            ),
                    object.y2 -
                        headLength *
                            Math.sin(
                                angle -
                                    Math.PI / 6
                            )
                );

                context.lineTo(
                    object.x2 -
                        headLength *
                            Math.cos(
                                angle +
                                    Math.PI / 6
                            ),
                    object.y2 -
                        headLength *
                            Math.sin(
                                angle +
                                    Math.PI / 6
                            )
                );

                context.closePath();

                context.fillStyle =
                    object.color ||
                    "#111827";

                context.fill();
                context.stroke();

                context.restore();
                return;
            }

            if (
                object.type ===
                "rectangle"
            ) {
                const width =
                    object.x2 -
                    object.x1;

                const height =
                    object.y2 -
                    object.y1;

                context.beginPath();

                context.rect(
                    object.x1,
                    object.y1,
                    width,
                    height
                );

                if (object.fill) {
                    context.fill();
                }

                context.stroke();

                context.restore();
                return;
            }

            if (
                object.type ===
                "circle"
            ) {
                const centerX =
                    (object.x1 +
                        object.x2) /
                    2;

                const centerY =
                    (object.y1 +
                        object.y2) /
                    2;

                const radiusX =
                    Math.abs(
                        object.x2 -
                            object.x1
                    ) / 2;

                const radiusY =
                    Math.abs(
                        object.y2 -
                            object.y1
                    ) / 2;

                context.beginPath();

                context.ellipse(
                    centerX,
                    centerY,
                    radiusX,
                    radiusY,
                    0,
                    0,
                    Math.PI * 2
                );

                if (object.fill) {
                    context.fill();
                }

                context.stroke();

                context.restore();
                return;
            }

            if (
                object.type ===
                "triangle"
            ) {
                const left =
                    Math.min(
                        object.x1,
                        object.x2
                    );

                const right =
                    Math.max(
                        object.x1,
                        object.x2
                    );

                const top =
                    Math.min(
                        object.y1,
                        object.y2
                    );

                const bottom =
                    Math.max(
                        object.y1,
                        object.y2
                    );

                context.beginPath();

                context.moveTo(
                    (left + right) / 2,
                    top
                );

                context.lineTo(
                    right,
                    bottom
                );

                context.lineTo(
                    left,
                    bottom
                );

                context.closePath();

                if (object.fill) {
                    context.fill();
                }

                context.stroke();

                context.restore();
                return;
            }

            if (object.type === "text") {
                const text =
                    typeof object.text ===
                    "string"
                        ? object.text
                        : "";

                const size =
                    object.size || 24;

                context.font =
                    `${size}px Inter, sans-serif`;

                context.fillStyle =
                    object.color ||
                    "#111827";

                context.fillText(
                    text,
                    object.x,
                    object.y
                );

                context.restore();
                return;
            }

            if (
                object.type ===
                "sticky"
            ) {
                context.fillStyle =
                    object.background ||
                    "#fef08a";

                context.strokeStyle =
                    "#eab308";

                context.beginPath();

                if (
                    typeof context.roundRect ===
                    "function"
                ) {
                    context.roundRect(
                        object.x,
                        object.y,
                        object.width ||
                            190,
                        object.height ||
                            135,
                        12
                    );
                } else {
                    context.rect(
                        object.x,
                        object.y,
                        object.width ||
                            190,
                        object.height ||
                            135
                    );
                }

                context.fill();
                context.stroke();

                context.fillStyle =
                    "#713f12";

                context.font =
                    "15px Inter, sans-serif";

                const text =
                    typeof object.text ===
                    "string"
                        ? object.text
                        : "";

                text.split("\n").forEach(
                    (line, index) => {
                        context.fillText(
                            line,
                            object.x + 12,
                            object.y +
                                25 +
                                index *
                                    20
                        );
                    }
                );

                context.restore();
                return;
            }

            context.restore();
        },
        []
    );

    // =====================================================
    // BOUNDS
    // =====================================================

    const getBounds = useCallback(
        (object) => {
            if (!object) {
                return null;
            }

            if (
                [
                    "line",
                    "arrow",
                    "rectangle",
                    "circle",
                    "triangle",
                ].includes(
                    object.type
                )
            ) {
                return {
                    x:
                        Math.min(
                            object.x1,
                            object.x2
                        ) - 8,

                    y:
                        Math.min(
                            object.y1,
                            object.y2
                        ) - 8,

                    width:
                        Math.abs(
                            object.x2 -
                                object.x1
                        ) + 16,

                    height:
                        Math.abs(
                            object.y2 -
                                object.y1
                        ) + 16,
                };
            }

            if (
                object.type ===
                "text"
            ) {
                const text =
                    typeof object.text ===
                    "string"
                        ? object.text
                        : "";

                const size =
                    object.size || 24;

                return {
                    x:
                        object.x - 5,

                    y:
                        object.y -
                        size,

                    width:
                        Math.max(
                            40,
                            text.length *
                                size *
                                0.55
                        ),

                    height:
                        size + 10,
                };
            }

            if (
                object.type ===
                "sticky"
            ) {
                return {
                    x:
                        object.x - 5,

                    y:
                        object.y - 5,

                    width:
                        (object.width ||
                            190) + 10,

                    height:
                        (object.height ||
                            135) + 10,
                };
            }

            if (
                object.type ===
                "stroke"
            ) {
                const points =
                    object.points || [];

                if (!points.length) {
                    return null;
                }

                const xs =
                    points.map(
                        (point) =>
                            point.x
                    );

                const ys =
                    points.map(
                        (point) =>
                            point.y
                    );

                const minX =
                    Math.min(...xs);

                const minY =
                    Math.min(...ys);

                const maxX =
                    Math.max(...xs);

                const maxY =
                    Math.max(...ys);

                return {
                    x: minX - 8,
                    y: minY - 8,

                    width:
                        maxX -
                        minX +
                        16,

                    height:
                        maxY -
                        minY +
                        16,
                };
            }

            return null;
        },
        []
    );

    // =====================================================
    // REDRAW
    // =====================================================

    const redraw = useCallback(() => {
        const canvas =
            canvasRef.current;

        if (!canvas) {
            return;
        }

        const context =
            canvas.getContext("2d");

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        objectsRef.current.forEach(
            (object) => {
                drawObject(
                    context,
                    object
                );
            }
        );

        if (selectedObjectId) {
            const selected =
                objectsRef.current.find(
                    (object) =>
                        object.id ===
                        selectedObjectId
                );

            if (selected) {
                const bounds =
                    getBounds(selected);

                if (bounds) {
                    context.save();

                    context.strokeStyle =
                        "#6366f1";

                    context.lineWidth =
                        1.5;

                    context.setLineDash(
                        [6, 4]
                    );

                    context.strokeRect(
                        bounds.x,
                        bounds.y,
                        bounds.width,
                        bounds.height
                    );

                    context.setLineDash([]);

                    context.fillStyle =
                        "#ffffff";

                    context.strokeStyle =
                        "#6366f1";

                    if (
                        selected.type ===
                        "arrow"
                    ) {
                        [
                            [
                                selected.x1,
                                selected.y1,
                            ],
                            [
                                selected.x2,
                                selected.y2,
                            ],
                        ].forEach(
                            ([x, y]) => {
                                context.beginPath();

                                context.arc(
                                    x,
                                    y,
                                    6,
                                    0,
                                    Math.PI * 2
                                );

                                context.fill();
                                context.stroke();
                            }
                        );
                    } else {
                        const handles = [
                            [
                                bounds.x,
                                bounds.y,
                            ],
                            [
                                bounds.x +
                                    bounds.width,
                                bounds.y,
                            ],
                            [
                                bounds.x,
                                bounds.y +
                                    bounds.height,
                            ],
                            [
                                bounds.x +
                                    bounds.width,
                                bounds.y +
                                    bounds.height,
                            ],
                        ];

                        handles.forEach(
                            ([x, y]) => {
                                context.beginPath();

                                context.rect(
                                    x - 4,
                                    y - 4,
                                    8,
                                    8
                                );

                                context.fill();
                                context.stroke();
                            }
                        );
                    }

                    context.restore();
                }
            }
        }
    }, [
        selectedObjectId,
        drawObject,
        getBounds,
    ]);

    // =====================================================
    // POSITION
    // =====================================================

    const getPosition = (event) => {
        const canvas =
            canvasRef.current;

        if (!canvas) {
            return {
                x: 0,
                y: 0,
            };
        }

        const rect =
            canvas.getBoundingClientRect();

        return {
            x:
                (event.clientX -
                    rect.left) /
                zoom,

            y:
                (event.clientY -
                    rect.top) /
                zoom,
        };
    };

    // =====================================================
    // HIT TEST
    // =====================================================

    const findObjectAt = (point) => {
        for (
            let i =
                objectsRef.current.length -
                1;
            i >= 0;
            i--
        ) {
            const object =
                objectsRef.current[i];

            const bounds =
                getBounds(object);

            if (!bounds) {
                continue;
            }

            if (
                point.x >= bounds.x &&
                point.x <=
                    bounds.x +
                        bounds.width &&
                point.y >= bounds.y &&
                point.y <=
                    bounds.y +
                        bounds.height
            ) {
                return object;
            }
        }

        return null;
    };

    // =====================================================
    // RESIZE HANDLE
    // =====================================================

    const findResizeHandle = (
        point,
        bounds
    ) => {
        if (!bounds) {
            return null;
        }

        const selected =
            selectedObjectRef.current;

        if (
            selected?.type ===
            "arrow"
        ) {
            const startDistance =
                Math.hypot(
                    point.x -
                        selected.x1,
                    point.y -
                        selected.y1
                );

            const endDistance =
                Math.hypot(
                    point.x -
                        selected.x2,
                    point.y -
                        selected.y2
                );

            if (startDistance <= 14) {
                return "start";
            }

            if (endDistance <= 14) {
                return "end";
            }

            return null;
        }

        const handles = {
            nw: [
                bounds.x,
                bounds.y,
            ],
            ne: [
                bounds.x +
                    bounds.width,
                bounds.y,
            ],
            sw: [
                bounds.x,
                bounds.y +
                    bounds.height,
            ],
            se: [
                bounds.x +
                    bounds.width,
                bounds.y +
                    bounds.height,
            ],
        };

        return (
            Object.entries(
                handles
            ).find(
                ([
                    ,
                    [x, y],
                ]) =>
                    Math.abs(
                        point.x - x
                    ) <= 12 &&
                    Math.abs(
                        point.y - y
                    ) <= 12
            )?.[0] || null
        );
    };

    // =====================================================
    // START DRAWING
    // =====================================================

    const startDrawing = (event) => {
        event.currentTarget.setPointerCapture?.(
            event.pointerId
        );

        const point =
            getPosition(event);

        if (tool === "select") {
            if (
                selectedObjectRef.current
            ) {
                const selectedBounds =
                    getBounds(
                        selectedObjectRef.current
                    );

                const resizeHandle =
                    findResizeHandle(
                        point,
                        selectedBounds
                    );

                if (resizeHandle) {
                    resizeHandleRef.current =
                        resizeHandle;

                    drawingRef.current =
                        true;

                    return;
                }
            }

            const object =
                findObjectAt(point);

            if (object) {
                selectedObjectRef.current =
                    object;

                setSelectedObjectId(
                    object.id
                );

                const baseX =
                    object.x ??
                    object.x1 ??
                    object.points?.[0]
                        ?.x ??
                    point.x;

                const baseY =
                    object.y ??
                    object.y1 ??
                    object.points?.[0]
                        ?.y ??
                    point.y;

                dragOffsetRef.current = {
                    x:
                        point.x -
                        baseX,

                    y:
                        point.y -
                        baseY,
                };

                resizeHandleRef.current =
                    null;

                drawingRef.current =
                    true;
            } else {
                selectedObjectRef.current =
                    null;

                setSelectedObjectId(
                    null
                );

                redraw();
            }

            return;
        }

        if (tool === "text") {
            setTextEditor({
                x: point.x,
                y: point.y,
                value: "",
            });

            return;
        }

        if (tool === "sticky") {
            setStickyEditor({
                x: point.x,
                y: point.y,
                value: "",
            });

            return;
        }

        drawingRef.current = true;

        let object;

        if (
            tool === "draw" ||
            tool === "eraser"
        ) {
            object = {
                id: createId(),
                type: "stroke",
                tool,
                color,

                width:
                    tool === "eraser"
                        ? brushSize * 4
                        : brushSize,

                points: [point],
            };
        } else {
            object = {
                id: createId(),
                type: tool,
                color,
                width: brushSize,

                x1: point.x,
                y1: point.y,
                x2: point.x,
                y2: point.y,
            };
        }

        objectsRef.current.push(
            object
        );

        currentObjectRef.current =
            object;

        redraw();
    };

    // =====================================================
    // MOVE DRAWING
    // =====================================================

    const moveDrawing = (event) => {
        if (!drawingRef.current) {
            return;
        }

        const point =
            getPosition(event);

        if (
            tool === "select" &&
            selectedObjectRef.current
        ) {
            const object =
                selectedObjectRef.current;

            if (
                resizeHandleRef.current &&
                [
                    "line",
                    "arrow",
                    "rectangle",
                    "circle",
                    "triangle",
                ].includes(
                    object.type
                )
            ) {
                const handle =
                    resizeHandleRef.current;

                if (
                    object.type ===
                    "arrow"
                ) {
                    if (
                        handle ===
                        "start"
                    ) {
                        object.x1 =
                            point.x;

                        object.y1 =
                            point.y;
                    }

                    if (
                        handle ===
                        "end"
                    ) {
                        object.x2 =
                            point.x;

                        object.y2 =
                            point.y;
                    }
                } else {
                    if (
                        handle.includes(
                            "w"
                        )
                    ) {
                        object.x1 =
                            point.x;
                    }

                    if (
                        handle.includes(
                            "e"
                        )
                    ) {
                        object.x2 =
                            point.x;
                    }

                    if (
                        handle.includes(
                            "n"
                        )
                    ) {
                        object.y1 =
                            point.y;
                    }

                    if (
                        handle.includes(
                            "s"
                        )
                    ) {
                        object.y2 =
                            point.y;
                    }
                }

                redraw();
                return;
            }

            const offset =
                dragOffsetRef.current;

            if (!offset) {
                return;
            }

            const newX =
                point.x -
                offset.x;

            const newY =
                point.y -
                offset.y;

            if (
                [
                    "line",
                    "arrow",
                    "rectangle",
                    "circle",
                    "triangle",
                ].includes(
                    object.type
                )
            ) {
                const width =
                    object.x2 -
                    object.x1;

                const height =
                    object.y2 -
                    object.y1;

                object.x1 = newX;
                object.y1 = newY;

                object.x2 =
                    newX + width;

                object.y2 =
                    newY + height;
            } else if (
                object.type ===
                    "text" ||
                object.type ===
                    "sticky"
            ) {
                object.x = newX;
                object.y = newY;
            } else if (
                object.type ===
                "stroke"
            ) {
                const first =
                    object.points?.[0];

                if (!first) {
                    return;
                }

                const moveX =
                    newX - first.x;

                const moveY =
                    newY - first.y;

                object.points =
                    object.points.map(
                        (point) => ({
                            x:
                                point.x +
                                moveX,

                            y:
                                point.y +
                                moveY,
                        })
                    );
            }

            redraw();
            return;
        }

        const object =
            currentObjectRef.current;

        if (!object) {
            return;
        }

        if (
            tool === "draw" ||
            tool === "eraser"
        ) {
            object.points.push(
                point
            );
        } else {
            object.x2 = point.x;
            object.y2 = point.y;
        }

        redraw();
    };

    // =====================================================
    // STOP DRAWING
    // =====================================================

    const stopDrawing = (event) => {
        if (!drawingRef.current) {
            return;
        }

        event?.currentTarget?.releasePointerCapture?.(
            event.pointerId
        );

        drawingRef.current = false;

        if (tool === "select") {
            saveHistory();

            publishWhiteboardState(
                objectsRef.current
            );

            selectedObjectRef.current =
                null;

            dragOffsetRef.current =
                null;

            resizeHandleRef.current =
                null;

            return;
        }

        const object =
            currentObjectRef.current;

        if (object) {
            publishWhiteboardObject(
                object
            );

            saveHistory();
        }

        currentObjectRef.current =
            null;
    };

    // =====================================================
    // TEXT
    // =====================================================

    const commitText = () => {
        if (
            !textEditor ||
            !textEditor.value.trim()
        ) {
            setTextEditor(null);
            return;
        }

        const object = {
            id: createId(),
            type: "text",

            text:
                textEditor.value.trim(),

            x: textEditor.x,
            y: textEditor.y,

            size: textSize,
            color,
        };

        objectsRef.current.push(
            object
        );

        publishWhiteboardObject(
            object
        );

        saveHistory();

        setTextEditor(null);

        redraw();
    };

    // =====================================================
    // STICKY
    // =====================================================

    const commitSticky = () => {
        if (
            !stickyEditor ||
            !stickyEditor.value.trim()
        ) {
            setStickyEditor(null);
            return;
        }

        const object = {
            id: createId(),
            type: "sticky",

            x: stickyEditor.x,
            y: stickyEditor.y,

            width: 190,
            height: 135,

            text:
                stickyEditor.value.trim(),

            background:
                "#fef08a",
        };

        objectsRef.current.push(
            object
        );

        publishWhiteboardObject(
            object
        );

        saveHistory();

        setStickyEditor(null);

        redraw();
    };

    // =====================================================
    // DELETE
    // =====================================================

    const deleteSelected =
        useCallback(() => {
            if (!selectedObjectId) {
                return;
            }

            objectsRef.current =
                objectsRef.current.filter(
                    (object) =>
                        object.id !==
                        selectedObjectId
                );

            setSelectedObjectId(null);

            saveHistory();

            publishWhiteboardState(
                objectsRef.current
            );

            redraw();
        }, [
            selectedObjectId,
            saveHistory,
            publishWhiteboardState,
            redraw,
        ]);

    // =====================================================
    // CLEAR
    // =====================================================

    const clearBoard = () => {
        if (
            objectsRef.current
                .length === 0
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                "Clear the entire whiteboard?"
            );

        if (!confirmed) {
            return;
        }

        objectsRef.current = [];

        setSelectedObjectId(null);

        saveHistory();

        publishWhiteboardState([]);

        redraw();
    };

    // =====================================================
    // UNDO
    // =====================================================

    const undo = useCallback(() => {
        if (
            historyIndexRef.current <=
            0
        ) {
            return;
        }

        historyIndexRef.current -= 1;

        const snapshot =
            historyRef.current[
                historyIndexRef.current
            ];

        objectsRef.current =
            JSON.parse(
                JSON.stringify(snapshot)
            );

        setSelectedObjectId(null);

        publishWhiteboardState(
            objectsRef.current
        );

        refresh();
        redraw();
    }, [
        publishWhiteboardState,
        refresh,
        redraw,
    ]);

    // =====================================================
    // REDO
    // =====================================================

    const redo = useCallback(() => {
        if (
            historyIndexRef.current >=
            historyRef.current.length -
                1
        ) {
            return;
        }

        historyIndexRef.current += 1;

        const snapshot =
            historyRef.current[
                historyIndexRef.current
            ];

        objectsRef.current =
            JSON.parse(
                JSON.stringify(snapshot)
            );

        setSelectedObjectId(null);

        publishWhiteboardState(
            objectsRef.current
        );

        refresh();
        redraw();
    }, [
        publishWhiteboardState,
        refresh,
        redraw,
    ]);

    // =====================================================
    // CANVAS RESIZE
    // =====================================================

    useEffect(() => {
        const canvas =
            canvasRef.current;

        if (!canvas) {
            return;
        }

        const resize = () => {
            const rect =
                canvas.getBoundingClientRect();

            canvas.width =
                Math.max(
                    300,
                    Math.floor(
                        rect.width
                    )
                );

            canvas.height =
                Math.max(
                    300,
                    Math.floor(
                        rect.height
                    )
                );

            redraw();
        };

        resize();

        window.addEventListener(
            "resize",
            resize
        );

        return () => {
            window.removeEventListener(
                "resize",
                resize
            );
        };
    }, [redraw]);

    // =====================================================
    // SOCKET ROOM
    // =====================================================

    useEffect(() => {
        if (!roomId) {
            return;
        }

        const normalizeUser = (user) => {
            if (!user) {
                return null;
            }

            return {
                id:
                    user.userId ??
                    user.id ??
                    user.socketId,

                userId:
                    user.userId ??
                    user.id,

                socketId:
                    user.socketId,

                name:
                    typeof user.name ===
                    "string"
                        ? user.name
                        : "Unknown user",

                role:
                    typeof user.role ===
                    "string"
                        ? user.role
                        : "Collaborator",
            };
        };

        const handleRoomUsers = (
            users
        ) => {
            if (!Array.isArray(users)) {
                setActiveUsers([]);
                return;
            }

            const normalized =
                users
                    .map(normalizeUser)
                    .filter(Boolean);

            setActiveUsers(
                normalized.map(
                    (user) => ({
                        ...user,

                        self:
                            user.userId ===
                                socket.id ||
                            user.name ===
                                currentUser.name,
                    })
                )
            );
        };

        const handleInitialState = (
            state
        ) => {
            if (!state) {
                return;
            }

            if (
                Array.isArray(
                    state.whiteboard
                )
            ) {
                const restoredObjects =
                    state.whiteboard
                        .map(
                            (entry) => {
                                if (
                                    entry &&
                                    entry.type ===
                                        "whiteboard-object" &&
                                    entry.item
                                ) {
                                    return entry.item;
                                }

                                if (
                                    entry &&
                                    entry.item &&
                                    typeof entry.item ===
                                        "object"
                                ) {
                                    return entry.item;
                                }

                                return entry;
                            }
                        )
                        .filter(Boolean);

                objectsRef.current =
                    restoredObjects;

                historyRef.current = [
                    JSON.parse(
                        JSON.stringify(
                            restoredObjects
                        )
                    ),
                ];

                historyIndexRef.current = 0;

                refresh();
                redraw();
            }

            if (
                typeof state.code ===
                "string"
            ) {
                setCode(state.code);
            }

            if (
                Array.isArray(
                    state.users
                )
            ) {
                handleRoomUsers(
                    state.users
                );
            }
        };

        const handleWhiteboardEvent = (
            message
        ) => {
            if (!message) {
                return;
            }

            if (
                message.type ===
                "whiteboard-object"
            ) {
                const object =
                    message.item;

                if (!object) {
                    return;
                }

                const exists =
                    objectsRef.current.some(
                        (existing) =>
                            existing.id ===
                            object.id
                    );

                if (!exists) {
                    objectsRef.current.push(
                        object
                    );

                    redraw();
                }

                return;
            }

            if (
                message.type ===
                "whiteboard-state"
            ) {
                const objects =
                    Array.isArray(
                        message.item
                    )
                        ? message.item
                        : [];

                objectsRef.current =
                    objects;

                setSelectedObjectId(
                    null
                );

                historyRef.current = [
                    JSON.parse(
                        JSON.stringify(
                            objects
                        )
                    ),
                ];

                historyIndexRef.current = 0;

                refresh();
                redraw();
            }
        };

        const handleCodeChange = (
            message
        ) => {
            if (!message) {
                return;
            }

            if (
                typeof message.code !==
                "string"
            ) {
                return;
            }

            setCode(message.code);
            setCodeSaved(false);
        };

        const joinRoom = () => {
            if (socket.connected) {
                socket.emit(
                    "join-room",
                    roomId
                );
            }
        };

        socket.on(
            "room-users",
            handleRoomUsers
        );

        socket.on(
            "initial-room-state",
            handleInitialState
        );

        socket.on(
            "whiteboard-event",
            handleWhiteboardEvent
        );

        socket.on(
            "code-change",
            handleCodeChange
        );

        socket.on(
            "connect",
            joinRoom
        );

        if (!socket.connected) {
            socket.connect();
        } else {
            joinRoom();
        }

        return () => {
            socket.off(
                "room-users",
                handleRoomUsers
            );

            socket.off(
                "initial-room-state",
                handleInitialState
            );

            socket.off(
                "whiteboard-event",
                handleWhiteboardEvent
            );

            socket.off(
                "code-change",
                handleCodeChange
            );

            socket.off(
                "connect",
                joinRoom
            );
        };
    }, [
        roomId,
        redraw,
        refresh,
        currentUser.name,
    ]);

    // =====================================================
    // INITIAL HISTORY
    // =====================================================

    useEffect(() => {
        if (
            historyRef.current
                .length === 0
        ) {
            historyRef.current = [[]];

            historyIndexRef.current = 0;
        }
    }, []);

    // =====================================================
    // REDRAW
    // =====================================================

    useEffect(() => {
        redraw();
    }, [
        selectedObjectId,
        historyVersion,
        redraw,
    ]);

    // =====================================================
    // KEYBOARD
    // =====================================================

    useEffect(() => {
        const handleKeyboard = (
            event
        ) => {
            const tag =
                document.activeElement
                    ?.tagName;

            if (
                tag === "INPUT" ||
                tag === "TEXTAREA"
            ) {
                if (
                    event.key ===
                    "Escape"
                ) {
                    setTextEditor(null);
                    setStickyEditor(null);
                }

                return;
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() ===
                    "z"
            ) {
                event.preventDefault();
                undo();
                return;
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() ===
                    "y"
            ) {
                event.preventDefault();
                redo();
                return;
            }

            if (
                event.key ===
                    "Delete" ||
                event.key ===
                    "Backspace"
            ) {
                deleteSelected();
                return;
            }

            switch (
                event.key.toLowerCase()
            ) {
                case "v":
                    setTool("select");
                    break;

                case "p":
                    setTool("draw");
                    break;

                case "e":
                    setTool("eraser");
                    break;

                case "t":
                    setTool("text");
                    break;

                case "l":
                    setTool("line");
                    break;

                case "a":
                    setTool("arrow");
                    break;

                case "r":
                    setTool("rectangle");
                    break;

                case "c":
                    setTool("circle");
                    break;

                case "3":
                    setTool("triangle");
                    break;

                case "s":
                    setTool("sticky");
                    break;

                default:
                    break;
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyboard
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyboard
            );
    }, [
        undo,
        redo,
        deleteSelected,
        setTool,
    ]);

    // =====================================================
    // SHARE
    // =====================================================

    const shareRoom = async () => {
        const shareText =
            `Join my SyncSpace workspace. Room ID: ${roomId}`;

        try {
            await navigator.clipboard.writeText(
                shareText
            );

            alert(
                "Room invite copied!"
            );
        } catch {
            alert(
                `Room ID: ${roomId}`
            );
        }
    };

    // =====================================================
    // CODE PANEL RESIZE
    // =====================================================

    useEffect(() => {
        const resizeCodePanel = (
            event
        ) => {
            if (
                !codeResizeRef.current
            ) {
                return;
            }

            const nextWidth =
                window.innerWidth -
                event.clientX;

            setCodePanelWidth(
                Math.min(
                    760,
                    Math.max(
                        320,
                        nextWidth
                    )
                )
            );
        };

        const stopResizingCode =
            () => {
                codeResizeRef.current =
                    false;

                document.body.style.cursor =
                    "";
            };

        window.addEventListener(
            "pointermove",
            resizeCodePanel
        );

        window.addEventListener(
            "pointerup",
            stopResizingCode
        );

        return () => {
            window.removeEventListener(
                "pointermove",
                resizeCodePanel
            );

            window.removeEventListener(
                "pointerup",
                stopResizingCode
            );
        };
    }, []);

    // =====================================================
    // TOOL BUTTON
    // =====================================================

    const ToolButton = ({
        name,
        icon,
        label,
        shortcut,
    }) => (
        <button
            type="button"
            className={
                tool === name
                    ? "tool active"
                    : "tool"
            }
            onClick={() =>
                setTool(name)
            }
            title={`${label} (${shortcut})`}
        >
            <span>{icon}</span>
            <small>
                {label}
            </small>
        </button>
    );

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="syncspace">

            {/* TOP BAR */}

            <header className="topbar">

                <div className="brand">

                    <div className="brand-icon">
                        S
                    </div>

                    <div className="brand-info">
                        <h1>
                            SyncSpace
                        </h1>

                        <span>
                            Interview workspace
                        </span>
                    </div>

                </div>

                <div className="workspace-info">

                    <div className="workspace-title">
                        <span>
                            Collaborative Whiteboard
                        </span>
                    </div>

                    <div className="connection">
                        <span className="connection-dot" />
                        Live workspace
                    </div>

                </div>

                <div className="top-actions">

                    <button
                        type="button"
                        className="active-users active-users-button"
                        aria-label={`${activeUsers.length} active users`}
                        aria-expanded={
                            showUserRoster
                        }
                        onClick={() =>
                            setShowUserRoster(
                                (value) =>
                                    !value
                            )
                        }
                    >

                        <div className="avatar-stack">

                            {activeUsers
                                .slice(0, 4)
                                .map(
                                    (
                                        user,
                                        index
                                    ) => (
                                        <span
                                            className={`user-avatar avatar-${index % 4}`}
                                            key={
                                                user.id ||
                                                user.socketId ||
                                                index
                                            }
                                            title={`${user.name || "Unknown"} · ${user.role || "Collaborator"}`}
                                        >
                                            {(user.name ||
                                                "?")
                                                .slice(
                                                    0,
                                                    1
                                                )
                                                .toUpperCase()}
                                        </span>
                                    )
                                )}

                        </div>

                        <span>
                            {activeUsers.length}{" "}
                            active
                        </span>

                    </button>

                    {showUserRoster && (
                        <div
                            className="user-roster"
                            role="dialog"
                            aria-label="Active users"
                        >

                            <div className="user-roster-heading">
                                <strong>
                                    In this workspace
                                </strong>

                                <span>
                                    {
                                        activeUsers.length
                                    }{" "}
                                    online
                                </span>
                            </div>

                            {activeUsers.map(
                                (
                                    user,
                                    index
                                ) => (
                                    <div
                                        className="roster-user"
                                        key={
                                            user.id ||
                                            user.socketId ||
                                            index
                                        }
                                    >

                                        <span
                                            className={`roster-avatar avatar-${index % 4}`}
                                        >
                                            {(user.name ||
                                                "?")
                                                .slice(
                                                    0,
                                                    1
                                                )
                                                .toUpperCase()}
                                        </span>

                                        <span>

                                            <strong>
                                                {
                                                    user.name
                                                }

                                                {user.self
                                                    ? " (you)"
                                                    : ""}
                                            </strong>

                                            <small>
                                                {
                                                    user.role
                                                }
                                            </small>

                                        </span>

                                        <i />

                                    </div>
                                )
                            )}

                        </div>
                    )}

                    <div className="room-id-display">

                        <span>
                            Room
                        </span>

                        <strong>
                            {roomId}
                        </strong>

                    </div>

                    <button
                        type="button"
                        className="share-btn"
                        onClick={
                            shareRoom
                        }
                    >
                        ↗ Share
                    </button>

                </div>

            </header>

            {/* MAIN */}

            <main className="workspace">

                {/* TOOLBAR */}

                <aside className="tool-panel">

                    <div
                        className="workspace-modes"
                        aria-label="Workspace pages"
                    >

                        <button
                            type="button"
                            className={
                                !isCodeOpen
                                    ? "mode-button active"
                                    : "mode-button"
                            }
                            onClick={() =>
                                setIsCodeOpen(
                                    false
                                )
                            }
                            title="Canvas page"
                        >
                            <span>
                                ▦
                            </span>

                            <small>
                                Canvas
                            </small>
                        </button>

                        <button
                            type="button"
                            className={
                                isCodeOpen
                                    ? "mode-button active"
                                    : "mode-button"
                            }
                            onClick={() =>
                                setIsCodeOpen(
                                    true
                                )
                            }
                            title="Open code page"
                        >
                            <span>
                                &lt;/&gt;
                            </span>

                            <small>
                                Code
                            </small>
                        </button>

                    </div>

                    <div className="tool-divider" />

                    <div className="tool-section">

                        <ToolButton
                            name="select"
                            icon="↖"
                            label="Select"
                            shortcut="V"
                        />

                        <ToolButton
                            name="draw"
                            icon="✎"
                            label="Pen"
                            shortcut="P"
                        />

                        <ToolButton
                            name="eraser"
                            icon="◇"
                            label="Eraser"
                            shortcut="E"
                        />

                    </div>

                    <div className="tool-divider" />

                    <div className="tool-section">

                        <ToolButton
                            name="line"
                            icon="╱"
                            label="Line"
                            shortcut="L"
                        />

                        <ToolButton
                            name="arrow"
                            icon="➜"
                            label="Arrow"
                            shortcut="A"
                        />

                        <ToolButton
                            name="rectangle"
                            icon="□"
                            label="Rect"
                            shortcut="R"
                        />

                        <ToolButton
                            name="circle"
                            icon="○"
                            label="Circle"
                            shortcut="C"
                        />

                        <ToolButton
                            name="triangle"
                            icon="△"
                            label="Triangle"
                            shortcut="3"
                        />

                    </div>

                    <div className="tool-divider" />

                    <div className="tool-section">

                        <ToolButton
                            name="text"
                            icon="T"
                            label="Text"
                            shortcut="T"
                        />

                        <ToolButton
                            name="sticky"
                            icon="▣"
                            label="Sticky"
                            shortcut="S"
                        />

                    </div>

                    <div className="tool-divider" />

                    <div className="tool-section">

                        <button
                            type="button"
                            className="tool code-tool"
                            onClick={() =>
                                setIsCodeOpen(
                                    true
                                )
                            }
                            title="Open code editor"
                        >
                            <span>
                                &lt;/&gt;
                            </span>

                            <small>
                                Editor
                            </small>
                        </button>

                        <button
                            type="button"
                            className="tool"
                            onClick={undo}
                            title="Undo (Ctrl + Z)"
                        >
                            <span>
                                ↶
                            </span>

                            <small>
                                Undo
                            </small>
                        </button>

                        <button
                            type="button"
                            className="tool"
                            onClick={redo}
                            title="Redo (Ctrl + Y)"
                        >
                            <span>
                                ↷
                            </span>

                            <small>
                                Redo
                            </small>
                        </button>

                        <button
                            type="button"
                            className="tool"
                            onClick={
                                deleteSelected
                            }
                            title="Delete selected"
                        >
                            <span>
                                ⌫
                            </span>

                            <small>
                                Delete
                            </small>
                        </button>

                    </div>

                    <div className="tool-divider" />

                    <div className="tool-section">

                        <button
                            type="button"
                            className={
                                showGrid
                                    ? "tool active"
                                    : "tool"
                            }
                            onClick={
                                toggleGrid
                            }
                        >
                            <span>
                                ▦
                            </span>

                            <small>
                                Grid
                            </small>
                        </button>

                        <button
                            type="button"
                            className="tool danger"
                            onClick={
                                clearBoard
                            }
                        >
                            <span>
                                🗑
                            </span>

                            <small>
                                Erase page
                            </small>
                        </button>

                    </div>

                </aside>

                {/* CANVAS */}

                <section
                    className={
                        showGrid
                            ? "canvas-area grid"
                            : "canvas-area"
                    }
                >

                    <div
                        className="canvas-container"
                        style={{
                            transform:
                                `scale(${zoom})`,
                        }}
                    >

                        <canvas
                            ref={canvasRef}
                            className="whiteboard-canvas"
                            onPointerDown={
                                startDrawing
                            }
                            onPointerMove={
                                moveDrawing
                            }
                            onPointerUp={
                                stopDrawing
                            }
                            onPointerCancel={
                                stopDrawing
                            }
                            onLostPointerCapture={
                                stopDrawing
                            }
                        />

                    </div>

                    {/* TEXT EDITOR */}

                    {textEditor && (
                        <input
                            autoFocus
                            className="text-editor"
                            style={{
                                left:
                                    textEditor.x *
                                    zoom,

                                top:
                                    textEditor.y *
                                        zoom -
                                    textSize,

                                fontSize:
                                    textSize,

                                color,
                            }}
                            value={
                                textEditor.value
                            }
                            placeholder="Type text..."
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
                    )}

                    {/* STICKY EDITOR */}

                    {stickyEditor && (
                        <div
                            className="sticky-editor"
                            style={{
                                left:
                                    stickyEditor.x *
                                    zoom,

                                top:
                                    stickyEditor.y *
                                    zoom,
                            }}
                        >

                            <textarea
                                autoFocus
                                placeholder="Write an interview note..."
                                value={
                                    stickyEditor.value
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStickyEditor(
                                        {
                                            ...stickyEditor,
                                            value:
                                                event
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />

                            <div className="sticky-actions">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setStickyEditor(
                                            null
                                        )
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        commitSticky
                                    }
                                >
                                    Add note
                                </button>

                            </div>

                        </div>
                    )}

                    <div className="live-badge">
                        <span />
                        Live canvas
                    </div>

                    {/* =========================================
                        EXTRACTED CODE EDITOR
                    ========================================= */}

                    {isCodeOpen && (
                        <CodeEditor
                            roomId={roomId}
                            code={code}
                            setCode={setCode}
                            language={language}
                            setLanguage={setLanguage}
                            codeSaved={codeSaved}
                            setCodeSaved={
                                setCodeSaved
                            }
                            codePanelWidth={
                                codePanelWidth
                            }
                            codeResizeRef={
                                codeResizeRef
                            }
                            setIsCodeOpen={
                                setIsCodeOpen
                            }
                            socket={socket}
                        />
                    )}

                </section>

            </main>

            {/* BOTTOM BAR */}

            <footer className="bottom-bar">

                <div className="bottom-left">

                    <div className="setting">

                        <span>
                            Color
                        </span>

                        <input
                            type="color"
                            value={color}
                            onChange={(
                                event
                            ) =>
                                setColor(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />

                    </div>

                    <div className="setting brush-setting">

                        <span>
                            Brush
                        </span>

                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={
                                brushSize
                            }
                            onChange={(
                                event
                            ) =>
                                setBrushSize(
                                    Number(
                                        event
                                            .target
                                            .value
                                    )
                                )
                            }
                        />

                        <b>
                            {brushSize}px
                        </b>

                    </div>

                    {tool ===
                        "text" && (
                        <div className="setting brush-setting">

                            <span>
                                Text
                            </span>

                            <input
                                type="range"
                                min="12"
                                max="64"
                                value={
                                    textSize
                                }
                                onChange={(
                                    event
                                ) =>
                                    setTextSize(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                            />

                            <b>
                                {textSize}px
                            </b>

                        </div>
                    )}

                </div>

                <div className="zoom-control">

                    <button
                        type="button"
                        onClick={
                            zoomOut
                        }
                    >
                        −
                    </button>

                    <button
                        type="button"
                        className="zoom-percent"
                        onClick={
                            resetZoom
                        }
                    >
                        {Math.round(
                            zoom * 100
                        )}
                        %
                    </button>

                    <button
                        type="button"
                        onClick={
                            zoomIn
                        }
                    >
                        +
                    </button>

                </div>

            </footer>

        </div>
    );
}

export default Whiteboard;