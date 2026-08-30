
import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Landing from "./components/Landing";
import Login from "./pages/login";
import Whiteboard from "./components/Whiteboard";

export default function App() {
    const navigate = useNavigate();

    // Workspace state
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");

    // Join an existing workspace
    const handleJoin = () => {
        if (!name.trim() || !roomId.trim()) {
            alert("Please enter your name and room ID.");
            return;
        }

        // For now, keep the existing behavior.
        // Later this will be replaced/extended with
        // authenticated workspace logic.
        localStorage.setItem("syncspace_name", name.trim());
        localStorage.setItem("syncspace_room", roomId.trim());

        navigate(`/room/${roomId.trim()}`);
    };

    // Create a new workspace
    const handleCreate = () => {
        const newRoomId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        setRoomId(newRoomId);

        localStorage.setItem("syncspace_name", name.trim());
        localStorage.setItem("syncspace_room", newRoomId);

        navigate(`/room/${newRoomId}`);
    };

    return (
        <Routes>

            {/* Landing page */}
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

            {/* Authentication page */}
            <Route
                path="/login"
                element={<Login />}
            />

            {/* Temporary room route */}
            <Route
                path="/room/:roomId"
                element={
                    <Whiteboard
                        roomId={roomId}
                        userName={name}
                    />
                }
            />

        </Routes>
    );
}

