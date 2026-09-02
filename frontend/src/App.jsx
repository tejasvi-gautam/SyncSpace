
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Whiteboard from "./components/Whiteboard";

export default function App() {
    return (
        <Routes>

            {/* Home / Login-style landing page */}
            <Route
                path="/"
                element={<Home />}
            />

            {/* Collaborative interview workspace */}
            <Route
                path="/room/:roomId"
                element={<Whiteboard />}
            />

            {/* Unknown URL */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

        </Routes>
    );
}
