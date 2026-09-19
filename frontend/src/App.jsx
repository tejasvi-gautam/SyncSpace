
import "./App.css";

import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Whiteboard from "./components/Whiteboard";

function ProtectedRoom() {
    const isAuthenticated =
        localStorage.getItem("syncspace_authenticated") === "true";

    return isAuthenticated ? (
        <Whiteboard />
    ) : (
        <Navigate to="/login" replace />
    );
}

function App() {
    return (
        <div className="app">
            <Routes>
                {/* Public landing page */}
                <Route
                    path="/"
                    element={<Home />}
                />

                {/* Authentication */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Authenticated dashboard */}
                <Route
                    path="/home"
                    element={<Home />}
                />

                {/* Protected collaborative room */}
                <Route
                    path="/room/:roomId"
                    element={<ProtectedRoom />}
                />

                {/* Unknown route */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </div>
    );
}

export default App;
