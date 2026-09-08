
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Whiteboard from "./components/Whiteboard";

function ProtectedRoom() {
    const isAuthenticated =
        localStorage.getItem("syncspace_authenticated") === "true" ||
        Boolean(localStorage.getItem("syncspace_room"));

    return isAuthenticated ? (
        <Whiteboard />
    ) : (
        <Navigate to="/" replace />
    );
}

function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route
                    path="/home"
                    element={<Home />}
                />

                {/* 🎨 Collaborative Whiteboard Room */}
                <Route
                    path="/room/:roomId"
                    element={<ProtectedRoom />}
                />

                {/* 🔄 Redirect invalid URLs to Login */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </div>
    );
}

export default App;
