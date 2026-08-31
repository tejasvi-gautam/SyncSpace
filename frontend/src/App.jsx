
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Room from "./Room";
import socket from "./socket";

import Landing from "./components/Landing";
import Login from "./pages/login";

export default function App() {
    const navigate = useNavigate();

    // =========================
    // WORKSPACE STATE
    // =========================

    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");

    // =========================
    // SOCKET ROOM MESSAGES
    // =========================

    useEffect(() => {
        const handleRoomMessage = (message) => {
            console.log("ROOM MESSAGE RECEIVED:", message);
        };

        socket.on("room-message", handleRoomMessage);

        return () => {
            socket.off("room-message", handleRoomMessage);
        };
    }, []);

    // =========================
    // JOIN EXISTING ROOM
    // =========================

    const handleJoin = () => {
        if (!name.trim() || !roomId.trim()) {
            alert("Please enter your name and room ID.");
            return;
        }

        const cleanName = name.trim();
        const cleanRoomId = roomId.trim();

        // Save workspace information
        localStorage.setItem("syncspace_name", cleanName);
        localStorage.setItem("syncspace_room", cleanRoomId);

        // Join Socket.IO room
        socket.emit("join-room", cleanRoomId);

        console.log("Joining room:", cleanRoomId);

        // Navigate to room
        navigate(`/room/${cleanRoomId}`);
    };

    // =========================
    // CREATE NEW ROOM
    // =========================

    const handleCreate = () => {
        if (!name.trim()) {
            alert("Please enter your name.");
            return;
        }

        const newRoomId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        const cleanName = name.trim();

        setRoomId(newRoomId);

        localStorage.setItem("syncspace_name", cleanName);
        localStorage.setItem("syncspace_room", newRoomId);

        // Join the newly created room
        socket.emit("join-room", newRoomId);

        console.log("Creating room:", newRoomId);

        navigate(`/room/${newRoomId}`);
    };

    // =========================
    // ROUTES
    // =========================

    return (
        <Routes>

            {/* Landing Page */}
            <Route
                path="/"
                element={
                    <Landing
                        name={name}
                        setName={setName}
                        roomId={roomId}
                        setRoomId={setRoomId}
                        handleJoin={handleJoin}
                        handleCreate={handleCreate}
                        navigate={navigate}
                    />
                }
            />

            {/* Authentication */}
            <Route
                path="/login"
                element={<Login />}
            />

            {/* Collaborative Room */}
            <Route
                path="/room/:roomId"
                element={<Room />}
            />

        </Routes>
    );
}
