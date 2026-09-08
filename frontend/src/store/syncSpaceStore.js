import { create } from "zustand";

export const useSyncSpaceStore = create((set) => ({
    // =========================
    // TOOL
    // =========================

    selectedTool: "select",

    selectedColor: "#111827",

    brushSize: 3,

    textSize: 24,

    // =========================
    // CANVAS
    // =========================

    zoom: 1,

    showGrid: true,

    // =========================
    // ROOM
    // =========================

    roomId: "",

    roomName: "My Whiteboard",

    // =========================
    // COLLABORATORS
    // =========================

    collaborators: [],

    // =========================
    // CODE
    // =========================

    code: "",

    language: "javascript",

    // =========================
    // TOOL ACTIONS
    // =========================

    setSelectedTool: (tool) =>
        set({
            selectedTool: tool,
        }),

    setSelectedColor: (color) =>
        set({
            selectedColor: color,
        }),

    setBrushSize: (size) =>
        set({
            brushSize: size,
        }),

    setTextSize: (size) =>
        set({
            textSize: size,
        }),

    // =========================
    // ZOOM
    // =========================

    zoomIn: () =>
        set((state) => ({
            zoom: Math.min(
                2,
                Number((state.zoom + 0.1).toFixed(1))
            ),
        })),

    zoomOut: () =>
        set((state) => ({
            zoom: Math.max(
                0.5,
                Number((state.zoom - 0.1).toFixed(1))
            ),
        })),

    resetZoom: () =>
        set({
            zoom: 1,
        }),

    // =========================
    // GRID
    // =========================

    toggleGrid: () =>
        set((state) => ({
            showGrid: !state.showGrid,
        })),

    // =========================
    // ROOM
    // =========================

    setRoomId: (roomId) =>
        set({
            roomId,
        }),

    setRoomName: (roomName) =>
        set({
            roomName,
        }),

    // =========================
    // COLLABORATORS
    // =========================

    setCollaborators: (collaborators) =>
        set({
            collaborators,
        }),

    addCollaborator: (collaborator) =>
        set((state) => ({
            collaborators: [
                ...state.collaborators,
                collaborator,
            ],
        })),

    removeCollaborator: (id) =>
        set((state) => ({
            collaborators:
                state.collaborators.filter(
                    (user) => user.id !== id
                ),
        })),

    // =========================
    // CODE
    // =========================

    setCode: (code) =>
        set({
            code,
        }),

    setLanguage: (language) =>
        set({
            language,
        }),
}));