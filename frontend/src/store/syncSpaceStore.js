import { create } from "zustand";

export const useSyncSpaceStore = create((set) => ({
    // =========================
    // WHITEBOARD STATE
    // =========================

    selectedTool: "draw",
    selectedColor: "#000000",
    brushSize: 3,

    // =========================
    // ROOM STATE
    // =========================

    roomId: "",
    roomName: "My Whiteboard",

    // =========================
    // CODE EDITOR STATE
    // =========================

    code: "",
    language: "javascript",

    // =========================
    // COLLABORATORS
    // =========================

    collaborators: [],

    // =========================
    // WHITEBOARD ACTIONS
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

    // =========================
    // ROOM ACTIONS
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
    // CODE EDITOR ACTIONS
    // =========================

    setCode: (code) =>
        set({
            code,
        }),

    setLanguage: (language) =>
        set({
            language,
        }),

    // =========================
    // COLLABORATOR ACTIONS
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
            collaborators: state.collaborators.filter(
                (user) => user.id !== id
            ),
        })),
}));