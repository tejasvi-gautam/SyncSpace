import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Whiteboard from "./components/Whiteboard";
import "./App.css";

function App() {
    return (
        <div className="app">
            <Routes>
                {/* Home / Join Room */}
                <Route
                    path="/"
                    element={<Home />}
                />

                {/* Collaborative Whiteboard Room */}
                <Route
                    path="/room/:roomId"
                    element={<Whiteboard />}
                />

                {/* Invalid URL */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </div>
    );
}

export default App;