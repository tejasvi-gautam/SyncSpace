import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { useSyncSpaceStore } from "../store/syncSpaceStore";
import socket from "../socket";

const languageTemplates = {
    JavaScript: `// SyncSpace interview workspace

function solveProblem(input) {
    return input.trim();
}

const result = solveProblem("Build together");

console.log(result);`,

    TypeScript: `// SyncSpace interview workspace

type Input = string;

function solveProblem(input: Input): Input {
    return input.trim();
}

console.log(solveProblem("Build together"));`,

    Python: `# SyncSpace interview workspace

def solve_problem(input_text):
    return input_text.strip()

result = solve_problem("Build together")

print(result)`,

    JSON: `{
  "project": "SyncSpace",
  "workspace": "Interview",
  "status": "shared"
}`,
};

function Whiteboard({ roomId = "ROOM" }) {
    const canvasRef = useRef(null);
    const channelRef = useRef(null);

    const objectsRef = useRef([]);
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);

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

    const [code, setCode] = useState(
        languageTemplates.JavaScript
    );

    const [language, setLanguage] =
        useState("JavaScript");

    const [codeSaved, setCodeSaved] =
        useState(false);

    const [isCodeOpen, setIsCodeOpen] =
        useState(false);

    const [showUserRoster, setShowUserRoster] =
        useState(false);

    const [codePanelWidth, setCodePanelWidth] =
        useState(430);

    const codeResizeRef = useRef(false);

    const [currentUser] = useState(() => {
        const name = localStorage.getItem("syncspace_username") || "You";
        const role = localStorage.getItem("syncspace_role") || "Collaborator";

        return {
            id: sessionStorage.getItem("syncspace_user_id") || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name,
            role,
        };
    });

    const [activeUsers, setActiveUsers] = useState([
        { ...currentUser, self: true },
    ]);

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
    // BROADCAST
    // =====================================================

    const publish = useCallback((message) => {
        channelRef.current?.postMessage(message);
    }, []);

    // =====================================================
    // HISTORY
    // =====================================================

    const saveHistory = useCallback(() => {
        const snapshot = JSON.parse(
            JSON.stringify(objectsRef.current)
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
            context.save();

            context.lineWidth =
                object.width || 3;

            context.strokeStyle =
                object.color || "#111827";

            context.fillStyle =
                object.fill || "transparent";

            context.lineCap = "round";
            context.lineJoin = "round";

            // -------------------------
            // PEN / ERASER
            // -------------------------

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

            // -------------------------
            // LINE
            // -------------------------

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

            // -------------------------
            // ARROW
            // -------------------------

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
                    object.color;

                context.fill();

                context.stroke();

                context.restore();
                return;
            }

            // -------------------------
            // RECTANGLE
            // -------------------------

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

            // -------------------------
            // CIRCLE
            // -------------------------

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

            if (object.type === "triangle") {
                const left = Math.min(object.x1, object.x2);
                const right = Math.max(object.x1, object.x2);
                const top = Math.min(object.y1, object.y2);
                const bottom = Math.max(object.y1, object.y2);

                context.beginPath();
                context.moveTo((left + right) / 2, top);
                context.lineTo(right, bottom);
                context.lineTo(left, bottom);
                context.closePath();

                if (object.fill) {
                    context.fill();
                }

                context.stroke();
                context.restore();
                return;
            }

            // -------------------------
            // TEXT
            // -------------------------

            if (object.type === "text") {
                context.font =
                    `${object.size || 24}px Inter, sans-serif`;

                context.fillStyle =
                    object.color ||
                    "#111827";

                context.fillText(
                    object.text,
                    object.x,
                    object.y
                );

                context.restore();
                return;
            }

            // -------------------------
            // STICKY NOTE
            // -------------------------

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
                        object.width,
                        object.height,
                        12
                    );
                } else {
                    context.rect(
                        object.x,
                        object.y,
                        object.width,
                        object.height
                    );
                }

                context.fill();
                context.stroke();

                context.fillStyle =
                    "#713f12";

                context.font =
                    "15px Inter, sans-serif";

                const lines =
                    object.text.split(
                        "\n"
                    );

                lines.forEach(
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
                return {
                    x:
                        object.x - 5,

                    y:
                        object.y -
                        object.size,

                    width:
                        Math.max(
                            40,
                            object.text
                                .length *
                                object.size *
                                0.55
                        ),

                    height:
                        object.size +
                        10,
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
                        object.width +
                        10,

                    height:
                        object.height +
                        10,
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

        // Selection
        if (selectedObjectId) {
            const selected =
                objectsRef.current.find(
                    (object) =>
                        object.id ===
                        selectedObjectId
                );

            if (selected) {
                const bounds =
                    getBounds(
                        selected
                    );

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

                    context.setLineDash(
                        []
                    );

                    context.fillStyle =
                        "#ffffff";

                    context.strokeStyle =
                        "#6366f1";

                    if (selected.type === "arrow") {
                        [
                            [selected.x1, selected.y1],
                            [selected.x2, selected.y2],
                        ].forEach(([x, y]) => {
                            context.beginPath();
                            context.arc(x, y, 6, 0, Math.PI * 2);
                            context.fill();
                            context.stroke();
                        });
                    } else {
                        const handles = [
                            [bounds.x, bounds.y],
                            [bounds.x + bounds.width, bounds.y],
                            [bounds.x, bounds.y + bounds.height],
                            [bounds.x + bounds.width, bounds.y + bounds.height],
                        ];

                        handles.forEach(([x, y]) => {
                            context.beginPath();
                            context.rect(x - 4, y - 4, 8, 8);
                            context.fill();
                            context.stroke();
                        });
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
                objectsRef.current
                    .length - 1;
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

    const findResizeHandle = (point, bounds) => {
        if (!bounds) {
            return null;
        }

        const selected = selectedObjectRef.current;

        if (selected?.type === "arrow") {
            const startDistance = Math.hypot(
                point.x - selected.x1,
                point.y - selected.y1
            );
            const endDistance = Math.hypot(
                point.x - selected.x2,
                point.y - selected.y2
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
            nw: [bounds.x, bounds.y],
            ne: [bounds.x + bounds.width, bounds.y],
            sw: [bounds.x, bounds.y + bounds.height],
            se: [bounds.x + bounds.width, bounds.y + bounds.height],
        };

        return Object.entries(handles).find(([, [x, y]]) =>
            Math.abs(point.x - x) <= 12 && Math.abs(point.y - y) <= 12
        )?.[0] || null;
    };

    // =====================================================
    // START DRAWING
    // =====================================================

    const startDrawing = (event) => {
        event.currentTarget
            .setPointerCapture?.(
                event.pointerId
            );

        const point =
            getPosition(event);

        // -------------------------
        // SELECT
        // -------------------------

        if (tool === "select") {
            if (selectedObjectRef.current) {
                const selectedBounds = getBounds(selectedObjectRef.current);
                const resizeHandle = findResizeHandle(point, selectedBounds);

                if (resizeHandle) {
                    resizeHandleRef.current = resizeHandle;
                    drawingRef.current = true;
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

                    resizeHandleRef.current = null;

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

        // -------------------------
        // TEXT
        // -------------------------

        if (tool === "text") {
            setTextEditor({
                x: point.x,
                y: point.y,
                value: "",
            });

            return;
        }

        // -------------------------
        // STICKY
        // -------------------------

        if (
            tool ===
            "sticky"
        ) {
            setStickyEditor({
                x: point.x,
                y: point.y,
                value: "",
            });

            return;
        }

        // -------------------------
        // DRAW
        // -------------------------

        drawingRef.current =
            true;

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
                    tool ===
                    "eraser"
                        ? brushSize *
                          4
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
    // MOVE / DRAW
    // =====================================================

    const moveDrawing = (event) => {
        if (!drawingRef.current) {
            return;
        }

        const point =
            getPosition(event);

        // -------------------------
        // MOVE SELECTED
        // -------------------------

        if (
            tool === "select" &&
            selectedObjectRef.current
        ) {
            const object =
                selectedObjectRef.current;

            if (resizeHandleRef.current && [
                "line",
                "arrow",
                "rectangle",
                "circle",
                "triangle",
            ].includes(object.type)) {
                const handle = resizeHandleRef.current;

                if (object.type === "arrow") {
                    if (handle === "start") {
                        object.x1 = point.x;
                        object.y1 = point.y;
                    }

                    if (handle === "end") {
                        object.x2 = point.x;
                        object.y2 = point.y;
                    }
                } else {
                    if (handle.includes("w")) object.x1 = point.x;
                    if (handle.includes("e")) object.x2 = point.x;
                    if (handle.includes("n")) object.y1 = point.y;
                    if (handle.includes("s")) object.y2 = point.y;
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
                    object.points[0];

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

        // -------------------------
        // DRAW
        // -------------------------

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
    // STOP
    // =====================================================

    const stopDrawing = () => {
        if (!drawingRef.current) {
            return;
        }

        drawingRef.current =
            false;

        if (tool === "select") {
            saveHistory();

            publish({
                type:
                    "whiteboard-state",

                objects:
                    objectsRef.current,
            });

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
            publish({
                type:
                    "whiteboard-object",

                object,
            });

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

        publish({
            type:
                "whiteboard-object",

            object,
        });

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

        publish({
            type:
                "whiteboard-object",

            object,
        });

        saveHistory();

        setStickyEditor(null);

        redraw();
    };

    // =====================================================
    // DELETE
    // =====================================================

    const deleteSelected = useCallback(() => {
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

        publish({
            type:
                "whiteboard-state",

            objects:
                objectsRef.current,
        });

        redraw();
    }, [
        selectedObjectId,
        saveHistory,
        publish,
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

        publish({
            type:
                "whiteboard-state",

            objects: [],
        });

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

        historyIndexRef.current -=
            1;

        const snapshot =
            historyRef.current[
                historyIndexRef.current
            ];

        objectsRef.current =
            JSON.parse(
                JSON.stringify(
                    snapshot
                )
            );

        setSelectedObjectId(null);

        publish({
            type:
                "whiteboard-state",

            objects:
                objectsRef.current,
        });

        refresh();
        redraw();
    }, [
        publish,
        refresh,
        redraw,
    ]);

    // =====================================================
    // REDO
    // =====================================================

    const redo = useCallback(() => {
        if (
            historyIndexRef.current >=
            historyRef.current
                .length -
                1
        ) {
            return;
        }

        historyIndexRef.current +=
            1;

        const snapshot =
            historyRef.current[
                historyIndexRef.current
            ];

        objectsRef.current =
            JSON.parse(
                JSON.stringify(
                    snapshot
                )
            );

        setSelectedObjectId(null);

        publish({
            type:
                "whiteboard-state",

            objects:
                objectsRef.current,
        });

        refresh();
        redraw();
    }, [
        publish,
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
    // ROOM CHANNEL
    // =====================================================

    useEffect(() => {
        if (
            !roomId ||
            typeof BroadcastChannel ===
                "undefined"
        ) {
            return undefined;
        }

        const channel =
            new BroadcastChannel(
                `syncspace-room-${roomId}`
            );

        channelRef.current =
            channel;

        channel.onmessage = (
            event
        ) => {
            const message =
                event.data;

            if (message.type === "presence-join" || message.type === "presence-ping") {
                setActiveUsers((users) => {
                    const nextUser = { ...message.user, self: false };
                    const withoutUser = users.filter((user) => user.id !== nextUser.id);
                    return [...withoutUser, nextUser];
                });
                return;
            }

            if (message.type === "presence-leave") {
                setActiveUsers((users) => users.filter((user) => user.id !== message.userId));
                return;
            }

            if (
                message.type ===
                "whiteboard-object"
            ) {
                const exists =
                    objectsRef.current.some(
                        (object) =>
                            object.id ===
                            message
                                .object
                                .id
                    );

                if (!exists) {
                    objectsRef.current.push(
                        message.object
                    );

                    redraw();
                }
            }

            if (
                message.type ===
                "whiteboard-state"
            ) {
                objectsRef.current =
                    message.objects ||
                    [];

                redraw();
                refresh();
            }

            if (
                message.type ===
                "whiteboard-request-state"
            ) {
                channel.postMessage({
                    type:
                        "whiteboard-state",

                    objects:
                        objectsRef.current,
                });
            }

            if (
                message.type ===
                "code-sync-request"
            ) {
                channel.postMessage({
                    type:
                        "code-sync",

                    code:
                        localStorage.getItem(
                            `syncspace-code-${language}`
                        ) ||
                        languageTemplates[
                            language
                        ],

                    language,
                });
            }

            if (
                message.type ===
                "code-sync"
            ) {
                setLanguage(
                    message.language
                );

                setCode(
                    message.code
                );

                setCodeSaved(false);
            }
        };

        const handleSocketUsers = (users) => {
            setActiveUsers(
                users.map((user) => ({
                    ...user,
                    self: user.userId === currentUser.id,
                }))
            );
        };

        const joinSocketRoom = () => {
            socket.emit("join-room", roomId);
        };

        socket.on("room-users", handleSocketUsers);
        socket.on("connect", joinSocketRoom);
        if (!socket.connected) {
            socket.connect();
        } else {
            joinSocketRoom();
        }

        channel.postMessage({
            type:
                "whiteboard-request-state",
        });

        sessionStorage.setItem("syncspace_user_id", currentUser.id);
        const presenceUser = {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
        };

        channel.postMessage({ type: "presence-join", user: presenceUser });
        const presenceInterval = window.setInterval(() => {
            channel.postMessage({ type: "presence-ping", user: presenceUser });
        }, 10000);

        channel.postMessage({
            type:
                "code-sync-request",
        });

        return () => {
            channel.postMessage({ type: "presence-leave", userId: currentUser.id });
            window.clearInterval(presenceInterval);
            socket.off("room-users", handleSocketUsers);
            socket.off("connect", joinSocketRoom);
            socket.disconnect();
            channel.close();
            channelRef.current =
                null;
        };
    }, [
        roomId,
        redraw,
        refresh,
        language,
        currentUser,
    ]);

    // =====================================================
    // INITIAL HISTORY
    // =====================================================

    useEffect(() => {
        if (
            historyRef.current
                .length === 0
        ) {
            historyRef.current = [
                [],
            ];

            historyIndexRef.current =
                0;
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
    // KEYBOARD SHORTCUTS
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
    // CODE EDITOR
    // =====================================================

    const updateCode = (event) => {
        const nextCode =
            event.target.value;

        setCode(nextCode);

        setCodeSaved(false);

        publish({
            type: "code-sync",
            code: nextCode,
            language,
        });
    };

    const changeLanguage = (
        event
    ) => {
        const nextLanguage =
            event.target.value;

        const savedCode =
            localStorage.getItem(
                `syncspace-code-${nextLanguage}`
            );

        const nextCode =
            savedCode ||
            languageTemplates[
                nextLanguage
            ];

        setLanguage(
            nextLanguage
        );

        setCode(nextCode);

        setCodeSaved(false);

        publish({
            type: "code-sync",
            code: nextCode,
            language:
                nextLanguage,
        });
    };

    const saveCode = () => {
        localStorage.setItem(
            `syncspace-code-${language}`,
            code
        );

        setCodeSaved(true);
    };

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

    useEffect(() => {
        const resizeCodePanel = (event) => {
            if (!codeResizeRef.current) return;
            const nextWidth = window.innerWidth - event.clientX;
            setCodePanelWidth(Math.min(760, Math.max(320, nextWidth)));
        };

        const stopResizingCode = () => {
            codeResizeRef.current = false;
            document.body.style.cursor = "";
        };

        window.addEventListener("pointermove", resizeCodePanel);
        window.addEventListener("pointerup", stopResizingCode);
        return () => {
            window.removeEventListener("pointermove", resizeCodePanel);
            window.removeEventListener("pointerup", stopResizingCode);
        };
    }, []);

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="syncspace">

            {/* =================================================
                TOP BAR
            ================================================= */}

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
                        aria-expanded={showUserRoster}
                        onClick={() => setShowUserRoster((value) => !value)}
                    >
                        <div className="avatar-stack">
                            {activeUsers.slice(0, 4).map((user, index) => (
                                <span
                                    className={`user-avatar avatar-${index % 4}`}
                                    key={user.id}
                                    title={`${user.name} · ${user.role}`}
                                >
                                    {user.name.slice(0, 1).toUpperCase()}
                                </span>
                            ))}
                        </div>
                        <span>{activeUsers.length} active</span>
                    </button>

                    {showUserRoster && (
                        <div className="user-roster" role="dialog" aria-label="Active users">
                            <div className="user-roster-heading">
                                <strong>In this workspace</strong>
                                <span>{activeUsers.length} online</span>
                            </div>
                            {activeUsers.map((user, index) => (
                                <div className="roster-user" key={user.id}>
                                    <span className={`roster-avatar avatar-${index % 4}`}>
                                        {user.name.slice(0, 1).toUpperCase()}
                                    </span>
                                    <span>
                                        <strong>{user.name}{user.self ? " (you)" : ""}</strong>
                                        <small>{user.role}</small>
                                    </span>
                                    <i />
                                </div>
                            ))}
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

            {/* =================================================
                MAIN WORKSPACE
            ================================================= */}

            <main className="workspace">

                {/* =================================================
                    TOOLBAR
                ================================================= */}

                <aside className="tool-panel">

                    <div className="workspace-modes" aria-label="Workspace pages">
                        <button
                            type="button"
                            className={!isCodeOpen ? "mode-button active" : "mode-button"}
                            onClick={() => setIsCodeOpen(false)}
                            title="Canvas page"
                        >
                            <span>▦</span>
                            <small>Canvas</small>
                        </button>
                        <button
                            type="button"
                            className={isCodeOpen ? "mode-button active" : "mode-button"}
                            onClick={() => setIsCodeOpen(true)}
                            title="Open code page"
                        >
                            <span>&lt;/&gt;</span>
                            <small>Code</small>
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
                            onClick={() => setIsCodeOpen(true)}
                            title="Open and resize code editor"
                        >
                            <span>&lt;/&gt;</span>
                            <small>Editor</small>
                        </button>

                        <button
                            type="button"
                            className="tool"
                            onClick={
                                undo
                            }
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
                            onClick={
                                redo
                            }
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

                {/* =================================================
                    CANVAS AREA
                ================================================= */}

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
                            ref={
                                canvasRef
                            }
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

                    {/* =================================================
                        CODE EDITOR
                    ================================================= */}

                    {isCodeOpen && <section className="floating-code-editor" style={{ width: `${codePanelWidth}px` }} aria-label="Code editor">

                        <button
                            type="button"
                            className="code-resize-handle"
                            onPointerDown={() => {
                                codeResizeRef.current = true;
                                document.body.style.cursor = "col-resize";
                            }}
                            title="Drag to resize code panel"
                            aria-label="Resize code panel"
                        >
                            <span>⟷</span>
                        </button>

                        <div className="floating-code-header">

                            <div>
                                <span>
                                    CODE
                                </span>

                                <strong>
                                    Interview Editor
                                </strong>
                            </div>

                            <div className="code-actions">

                                <button
                                    type="button"
                                    className="code-close"
                                    onClick={() => setIsCodeOpen(false)}
                                    title="Close code editor"
                                    aria-label="Close code editor"
                                >
                                    ×
                                </button>

                                <select
                                    value={
                                        language
                                    }
                                    onChange={
                                        changeLanguage
                                    }
                                >
                                    <option>
                                        JavaScript
                                    </option>

                                    <option>
                                        TypeScript
                                    </option>

                                    <option>
                                        Python
                                    </option>

                                    <option>
                                        JSON
                                    </option>
                                </select>

                                <button
                                    type="button"
                                    onClick={
                                        saveCode
                                    }
                                >
                                    {codeSaved
                                        ? "✓ Saved"
                                        : "Save"}
                                </button>

                            </div>

                        </div>

                        <div className="code-status">

                            <span />

                            Shared coding panel

                            <b>
                                {language}
                            </b>

                        </div>

                        <div className="code-body">

                            <div
                                className="code-lines"
                                aria-hidden="true"
                            >
                                {code
                                    .split(
                                        "\n"
                                    )
                                    .map(
                                        (
                                            _,
                                            index
                                        ) => (
                                            <span
                                                key={
                                                    index
                                                }
                                            >
                                                {index +
                                                    1}
                                            </span>
                                        )
                                    )}
                            </div>

                            <textarea
                                value={
                                    code
                                }
                                onChange={
                                    updateCode
                                }
                                spellCheck="false"
                                aria-label="Shared code editor"
                            />

                        </div>

                    </section>}

                </section>

            </main>

            {/* =================================================
                BOTTOM BAR
            ================================================= */}

            <footer className="bottom-bar">

                <div className="bottom-left">

                    <div className="setting">

                        <span>
                            Color
                        </span>

                        <input
                            type="color"
                            value={
                                color
                            }
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