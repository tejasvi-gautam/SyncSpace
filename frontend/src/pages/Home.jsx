import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import LoginModal from "../components/LoginModal";

export default function Home() {
    const navigate = useNavigate();

    const [name, setName] = useState(
        localStorage.getItem("syncspace_username") || ""
    );

    const [roomId, setRoomId] = useState("");
    const [role, setRole] = useState("Candidate");
    const [formError, setFormError] = useState("");
    const [isSignInOpen, setIsSignInOpen] = useState(false);

    useEffect(() => {
        const savedRoom = localStorage.getItem("syncspace_room");

        if (savedRoom) {
            setRoomId(savedRoom);
        }
    }, []);

    // ==========================================
    // OPEN LOGIN
    // ==========================================

    const openLogin = () => {
        setIsSignInOpen(true);
    };

    // ==========================================
    // JOIN EXISTING ROOM
    // ==========================================

    const joinRoom = () => {
        const cleanName = name.trim();
        const cleanRoomId = roomId.trim().toUpperCase();

        if (!cleanName) {
            setFormError("Add your name before entering a room.");
            return;
        }

        if (!cleanRoomId) {
            setFormError(
                "Enter a Room ID to join an existing workspace."
            );
            return;
        }

        setFormError("");

        localStorage.setItem(
            "syncspace_username",
            cleanName
        );

        localStorage.setItem(
            "syncspace_role",
            role
        );

        localStorage.setItem(
            "syncspace_room",
            cleanRoomId
        );

        // Allow access to the whiteboard
        localStorage.setItem(
            "syncspace_authenticated",
            "true"
        );

        navigate(`/room/${cleanRoomId}`);
    };

    // ==========================================
    // CREATE NEW ROOM
    // ==========================================

    const createRoom = () => {
        const cleanName = name.trim();

        if (!cleanName) {
            setFormError(
                "Add your name before creating a room."
            );
            return;
        }

        setFormError("");

        const newRoomId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        localStorage.setItem(
            "syncspace_username",
            cleanName
        );

        localStorage.setItem(
            "syncspace_role",
            role
        );

        localStorage.setItem(
            "syncspace_room",
            newRoomId
        );

        localStorage.setItem(
            "syncspace_authenticated",
            "true"
        );

        navigate(`/room/${newRoomId}`);
    };

    return (
        <div className="home-page">

            {/* ==========================================
                BACKGROUND
            ========================================== */}

            <div className="home-background">
                <div className="background-orb orb-one"></div>
                <div className="background-orb orb-two"></div>
                <div className="background-grid"></div>
            </div>

            {/* ==========================================
                NAVBAR
            ========================================== */}

            <header className="home-navbar">

                <div className="home-logo">

                    <div className="home-logo-icon">
                        S
                    </div>

                    <div>
                        <div className="home-logo-name">
                            SyncSpace
                        </div>

                        <div className="home-logo-tag">
                            COLLABORATE · BUILD · INTERVIEW
                        </div>
                    </div>

                </div>

                <div className="home-nav-status">
                    <span className="status-indicator"></span>
                    Workspace online
                </div>

                <div className="home-nav-actions">

                    <span className="nav-audience">
                        Built for focused collaboration
                    </span>

                    {/* SIGN IN BUTTON */}

                    <button
                        className="sign-in-button"
                        type="button"
                        onClick={openLogin}
                    >
                        <span>SIGN IN</span>

                        <span
                            className="login-arrow"
                            aria-hidden="true"
                        >
                            ↗
                        </span>
                    </button>

                </div>

            </header>

            {/* ==========================================
                MAIN
            ========================================== */}

            <main className="home-main">

                {/* ==========================================
                    HERO
                ========================================== */}

                <section className="home-hero">

                    <div className="hero-copy">

                        <div className="hero-pill">
                            <span>✦</span>
                            REAL-TIME INTERVIEW WORKSPACE
                        </div>

                        <h1>
                            Think together.
                            <br />
                            <span>Build together.</span>
                        </h1>

                        <p>
                            A focused workspace for technical interviews,
                            collaborative problem solving and brainstorming.
                            Draw on the whiteboard while writing code side
                            by side.
                        </p>

                        <div className="hero-features">

                            <div>
                                <span>✓</span>
                                Interactive whiteboard
                            </div>

                            <div>
                                <span>✓</span>
                                Built-in code editor
                            </div>

                            <div>
                                <span>✓</span>
                                Shared interview room
                            </div>

                        </div>

                    </div>

                    {/* ==========================================
                        JOIN CARD
                    ========================================== */}

                    <form
                        className="join-card"
                        onSubmit={(event) => {
                            event.preventDefault();
                            joinRoom();
                        }}
                    >

                        <div className="join-card-top">

                            <div>

                                <div className="join-eyebrow">
                                    GET STARTED
                                </div>

                                <h2>
                                    Enter your workspace
                                </h2>

                                <p>
                                    Join an existing interview or create
                                    a new room.
                                </p>

                            </div>

                            <div className="live-badge">
                                <span></span>
                                LIVE
                            </div>

                        </div>

                        {/* NAME */}

                        <div className="form-field">

                            <label htmlFor="name">
                                Your name
                            </label>

                            <div className="input-box">

                                <span className="input-symbol">
                                    👤
                                </span>

                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setFormError("");
                                    }}
                                />

                            </div>

                        </div>

                        {/* ROLE */}

                        <div className="form-field">

                            <label htmlFor="role">
                                Your role
                            </label>

                            <div className="input-box">

                                <span className="input-symbol">
                                    ◉
                                </span>

                                <select
                                    id="role"
                                    value={role}
                                    onChange={(event) =>
                                        setRole(event.target.value)
                                    }
                                >
                                    <option value="Candidate">
                                        Candidate
                                    </option>

                                    <option value="Interviewer">
                                        Interviewer
                                    </option>
                                </select>

                            </div>

                        </div>

                        {/* ROOM ID */}

                        <div className="form-field">

                            <label htmlFor="room">
                                Room ID
                            </label>

                            <div className="input-box">

                                <span className="input-symbol">
                                    #
                                </span>

                                <input
                                    id="room"
                                    type="text"
                                    placeholder="e.g. A7K29X"
                                    value={roomId}
                                    onChange={(event) => {
                                        setRoomId(
                                            event.target.value.toUpperCase()
                                        );
                                        setFormError("");
                                    }}
                                    maxLength={12}
                                />

                            </div>

                        </div>

                        {/* JOIN */}

                        <button
                            className="join-room-button"
                            type="submit"
                        >
                            <span>
                                Join interview room
                            </span>

                            <strong>
                                →
                            </strong>
                        </button>

                        <div className="or-divider">
                            <span></span>
                            or
                            <span></span>
                        </div>

                        {/* CREATE */}

                        <button
                            className="create-room-button"
                            type="button"
                            onClick={createRoom}
                        >
                            <span className="plus-icon">
                                +
                            </span>

                            Create a new room
                        </button>

                        <div className="privacy-note">
                            <span>🔒</span>
                            Your workspace information is saved
                            locally on this device.
                        </div>

                        <div
                            className={`form-feedback ${
                                formError ? "is-visible" : ""
                            }`}
                            role="alert"
                        >
                            {formError}
                        </div>

                    </form>

                </section>

                {/* ==========================================
                    WORKSPACE PREVIEW
                ========================================== */}

                <section className="workspace-preview-section">

                    <div className="preview-heading">

                        <span>
                            ONE WORKSPACE
                        </span>

                        <h2>
                            Everything in one place
                        </h2>

                    </div>

                    <div className="workspace-preview">

                        <div className="preview-header">

                            <div className="preview-brand">

                                <div>
                                    S
                                </div>

                                SyncSpace

                            </div>

                            <div className="preview-room">
                                Technical Interview · A7K29X
                            </div>

                            <div className="preview-live">
                                <span></span>
                                Connected
                            </div>

                        </div>

                        <div className="preview-body">

                            {/* SIDEBAR */}

                            <div className="preview-sidebar">

                                <div className="preview-tool active">
                                    ✎
                                </div>

                                <div className="preview-tool">
                                    T
                                </div>

                                <div className="preview-tool">
                                    □
                                </div>

                                <div className="preview-tool">
                                    →
                                </div>

                                <div className="preview-tool">
                                    ⌫
                                </div>

                                <div className="preview-line"></div>

                                <div className="preview-tool">
                                    ↶
                                </div>

                                <div className="preview-tool">
                                    ↷
                                </div>

                            </div>

                            {/* CANVAS */}

                            <div className="preview-canvas">

                                <div className="preview-grid"></div>

                                <div className="preview-card problem">
                                    Problem
                                </div>

                                <div className="preview-arrow">
                                    →
                                </div>

                                <div className="preview-card solution">
                                    Solution
                                </div>

                                <div className="preview-connector">
                                    ↓
                                </div>

                                <div className="preview-card result">
                                    Result
                                </div>

                            </div>

                            {/* CODE */}

                            <div className="preview-code">

                                <div className="preview-code-header">

                                    <strong>
                                        &lt;/&gt; Code
                                    </strong>

                                    <span>
                                        JavaScript ▾
                                    </span>

                                </div>

                                <div className="preview-code-content">

                                    <div>
                                        <i>01</i>
                                        function solve() {"{"}
                                    </div>

                                    <div>
                                        <i>02</i>
                                        &nbsp;&nbsp;const result = problem();
                                    </div>

                                    <div>
                                        <i>03</i>
                                        &nbsp;&nbsp;return result;
                                    </div>

                                    <div>
                                        <i>04</i>
                                        {"}"}
                                    </div>

                                </div>

                                <button>
                                    ▶ Run
                                </button>

                            </div>

                        </div>

                    </div>

                </section>

            </main>

            {/* ==========================================
                FOOTER
            ========================================== */}

            <footer className="home-footer">

                <span>
                    © 2026 SyncSpace
                </span>

                <span>
                    Collaborative technical interview workspace
                </span>

            </footer>

            <nav className="scroll-controls" aria-label="Page navigation">
                <button
                    type="button"
                    aria-label="Scroll up"
                    onClick={() =>
                        document.querySelector(".home-page")?.scrollBy({
                            top: -window.innerHeight * 0.85,
                            behavior: "smooth",
                        })
                    }
                >
                    ↑
                </button>

                <button
                    type="button"
                    aria-label="Scroll down"
                    onClick={() =>
                        document.querySelector(".home-page")?.scrollBy({
                            top: window.innerHeight * 0.85,
                            behavior: "smooth",
                        })
                    }
                >
                    ↓
                </button>
            </nav>

            {/* ==========================================
                SIGN IN MODAL
            ========================================== */}

            {isSignInOpen && (
                <LoginModal
                    onClose={() => setIsSignInOpen(false)}
                />
            )}

        </div>
    );
}