
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Home.css";

export default function Home() {

    const navigate = useNavigate();

    const [name, setName] = useState(
        localStorage.getItem("syncspace_username") || ""
    );

    const [roomId, setRoomId] = useState("");

    const [role, setRole] = useState("Candidate");
    const [formError, setFormError] = useState("");
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [authMode, setAuthMode] = useState("signin");
    const [authForm, setAuthForm] = useState({
        name: "",
        email: "",
        password: "",
        remember: true,
    });
    const [authStatus, setAuthStatus] = useState({
        type: "",
        message: "",
    });
    const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                setIsSignInOpen(false);
            }
        };

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    const openAuth = (mode) => {
        setAuthMode(mode);
        setAuthStatus({ type: "", message: "" });
        setIsSignInOpen(true);
    };

    const updateAuthField = (field, value) => {
        setAuthForm((current) => ({
            ...current,
            [field]: value,
        }));
        setAuthStatus({ type: "", message: "" });
    };

    const handleAuthSubmit = async (event) => {
        event.preventDefault();

        setIsAuthSubmitting(true);
        setAuthStatus({ type: "", message: "" });

        const isSignUp = authMode === "signup";
        const endpoint = isSignUp ? "register" : "login";
        const payload = isSignUp
            ? {
                name: authForm.name.trim(),
                email: authForm.email.trim(),
                password: authForm.password,
                role: "interviewee",
            }
            : {
                email: authForm.email.trim(),
                password: authForm.password,
            };

        try {
            const response = await fetch(
                `http://localhost:54321/api/auth/${endpoint}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to complete authentication.");
            }

            if (isSignUp) {
                setAuthMode("signin");
                setAuthForm((current) => ({
                    ...current,
                    password: "",
                }));
                setAuthStatus({
                    type: "success",
                    message: "Account created. Sign in to enter your workspace.",
                });
            } else {
                localStorage.setItem("syncspace_email", authForm.email.trim());
                setAuthStatus({
                    type: "success",
                    message: "Signed in successfully.",
                });
                setTimeout(() => setIsSignInOpen(false), 650);
            }
        } catch (error) {
            setAuthStatus({
                type: "error",
                message: error.message,
            });
        } finally {
            setIsAuthSubmitting(false);
        }
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
            setFormError("Enter a Room ID to join an existing workspace.");
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

        navigate(`/room/${cleanRoomId}`);
    };

    // ==========================================
    // CREATE ROOM
    // ==========================================

    const createRoom = () => {

        const cleanName = name.trim();

        if (!cleanName) {
            setFormError("Add your name before creating a room.");
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

        navigate(`/room/${newRoomId}`);
    };

    return (

        <div className="home-page">

            {/* Background */}
            <div className="home-background">
                <div className="background-orb orb-one"></div>
                <div className="background-orb orb-two"></div>
                <div className="background-grid"></div>
            </div>

            {/* ==================================
                NAVBAR
            ================================== */}

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

                    <button
                        className="sign-in-button"
                        type="button"
                        onClick={() => navigate("/login")}
                    >
                        Sign in
                        <span aria-hidden="true">↗</span>
                    </button>

                </div>

            </header>

            {/* ==================================
                MAIN
            ================================== */}

            <main className="home-main">

                <section className="home-hero">

                    {/* ==================================
                        LEFT CONTENT
                    ================================== */}

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

                    {/* ==================================
                        JOIN CARD
                    ================================== */}

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
                                    aria-invalid={Boolean(formError)}
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
                                    onChange={(e) =>
                                        setRole(e.target.value)
                                    }
                                >
                                    <option>
                                        Candidate
                                    </option>

                                    <option>
                                        Interviewer
                                    </option>
                                </select>

                            </div>

                        </div>

                        {/* ROOM */}

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
                                    aria-invalid={Boolean(formError)}
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
                            className={`form-feedback ${formError ? "is-visible" : ""}`}
                            role="alert"
                            aria-live="polite"
                        >
                            {formError}
                        </div>

                    </form>

                </section>

                {/* ==================================
                    PRODUCT PREVIEW
                ================================== */}

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

                        {/* HEADER */}

                        <div className="preview-header">

                            <div className="preview-brand">
                                <div>S</div>
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

                        {/* BODY */}

                        <div className="preview-body">

                            {/* TOOLS */}

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

            <footer className="home-footer">

                <span>
                    © 2026 SyncSpace
                </span>

                <span>
                    Collaborative technical interview workspace
                </span>

            </footer>

            {isSignInOpen && (
                <div
                    className="auth-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsSignInOpen(false);
                        }
                    }}
                >

                    <section
                        className="auth-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="auth-title"
                    >

                        <button
                            className="auth-close"
                            type="button"
                            aria-label="Close sign in"
                            onClick={() => setIsSignInOpen(false)}
                        >
                            ×
                        </button>

                        <div className="auth-brand-mark">S</div>

                        <p className="auth-kicker">
                            WELCOME BACK
                        </p>

                        <h2 id="auth-title">
                            {authMode === "signin" ? "Sign in to SyncSpace" : "Create your account"}
                        </h2>

                        <p className="auth-intro">
                            {authMode === "signin"
                                ? "Pick up where your team left off."
                                : "Set up your account and start collaborating."}
                        </p>

                        <form
                            className="auth-form"
                            onSubmit={handleAuthSubmit}
                        >

                            {authMode === "signup" && (
                                <label>
                                    Full name
                                    <input
                                        type="text"
                                        placeholder="Alex Morgan"
                                        autoComplete="name"
                                        value={authForm.name}
                                        onChange={(event) => updateAuthField("name", event.target.value)}
                                        required
                                    />
                                </label>
                            )}

                            <label>
                                Work email
                                <input
                                    type="email"
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    autoFocus
                                    value={authForm.email}
                                    onChange={(event) => updateAuthField("email", event.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Password
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                                    value={authForm.password}
                                    onChange={(event) => updateAuthField("password", event.target.value)}
                                    minLength={8}
                                    required
                                />
                            </label>

                            {authMode === "signin" && (
                                <div className="auth-form-options">
                                    <label className="remember-option">
                                        <input
                                            type="checkbox"
                                            checked={authForm.remember}
                                            onChange={(event) => updateAuthField("remember", event.target.checked)}
                                        />
                                        <span>Remember me</span>
                                    </label>
                                    <button
                                        className="text-button"
                                        type="button"
                                        onClick={() => setAuthStatus({
                                            type: "info",
                                            message: "Password recovery will be available soon.",
                                        })}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button className="auth-submit" type="submit" disabled={isAuthSubmitting}>
                                {isAuthSubmitting
                                    ? "Working..."
                                    : authMode === "signin"
                                        ? "Sign in"
                                        : "Create account"}
                                <span aria-hidden="true">→</span>
                            </button>

                            <p className={`auth-status ${authStatus.type}`} role="status" aria-live="polite">
                                {authStatus.message}
                            </p>

                        </form>

                        <div className="auth-switch">
                            <span>{authMode === "signin" ? "New to SyncSpace?" : "Already have an account?"}</span>
                            <button
                                className="text-button"
                                type="button"
                                onClick={() => openAuth(authMode === "signin" ? "signup" : "signin")}
                            >
                                {authMode === "signin" ? "Create an account" : "Sign in instead"}
                            </button>
                        </div>

                        <p className="auth-security-note">
                            <span aria-hidden="true">◆</span>
                            Secure workspace access
                        </p>

                    </section>

                </div>
            )}

        </div>
    );
}
