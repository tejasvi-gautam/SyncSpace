import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginModal.css";

export default function LoginModal({ onClose }) {
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState(
        localStorage.getItem("syncspace_email") || ""
    );

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:54321";

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        const cleanEmail = email.trim();

        if (!cleanEmail) {
            setError("Please enter your email address.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        if (isSignUp && !name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (
            isSignUp &&
            (!/[A-Z]/.test(password) ||
                !/[a-z]/.test(password) ||
                !/[0-9]/.test(password) ||
                !/[^A-Za-z0-9]/.test(password))
        ) {
            setError("Sign-up passwords need upper- and lowercase letters, a number, and a special character.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isSignUp) {
                const registerResponse = await fetch(`${apiUrl}/api/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: name.trim(),
                        email: cleanEmail,
                        password,
                        role: "interviewee",
                    }),
                });

                const registerData = await registerResponse.json();
                if (!registerResponse.ok) {
                    throw new Error(registerData.message || registerData.errors?.join(" ") || "Unable to create your account.");
                }
            }

            const loginResponse = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: cleanEmail, password }),
            });

            const loginData = await loginResponse.json();
            if (!loginResponse.ok) {
                throw new Error(loginData.message || loginData.errors?.join(" ") || "Unable to sign in.");
            }

            localStorage.setItem(
                "syncspace_authenticated",
                "true"
            );

            localStorage.setItem(
                "syncspace_email",
                cleanEmail
            );

            localStorage.setItem(
                "syncspace_username",
                isSignUp ? name.trim() : cleanEmail.split("@")[0]
            );

            localStorage.setItem(
                "syncspace_role",
                "Candidate"
            );

            // Get existing room or create a new one
            let roomId = localStorage.getItem(
                "syncspace_room"
            );

            if (!roomId) {
                roomId = Math.random()
                    .toString(36)
                    .substring(2, 8)
                    .toUpperCase();

                localStorage.setItem(
                    "syncspace_room",
                    roomId
                );
            }

            // Close modal
            onClose();

            // Open whiteboard
            navigate(`/room/${roomId}`);
        } catch (err) {
            setError(err.message || (isSignUp ? "Unable to create your account." : "Unable to sign in."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="login-modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                className="login-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-title"
            >
                {/* Close button */}
                <button
                    className="login-close"
                    type="button"
                    onClick={onClose}
                    aria-label="Close login"
                >
                    ×
                </button>

                {/* Brand */}
                <div className="login-brand">
                    S
                </div>

                {/* Heading */}
                <p className="login-kicker">
                    {isSignUp ? "GET STARTED" : "WELCOME BACK"}
                </p>

                <h2 id="login-title">
                    {isSignUp ? "Create your SyncSpace account" : "Sign in to SyncSpace"}
                </h2>

                <p className="login-description">
                    {isSignUp
                        ? "Create an account to access your collaborative interview workspace."
                        : "Continue to your collaborative interview workspace."}
                </p>

                {/* Login form */}
                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
                    {isSignUp && (
                        <div className="login-field">
                            <label htmlFor="login-name">
                                Your name
                            </label>

                            <input
                                id="login-name"
                                type="text"
                                placeholder="Alex Morgan"
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    setError("");
                                }}
                                autoComplete="name"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div className="login-field">
                        <label htmlFor="login-email">
                            Email address
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setError("");
                            }}
                            autoComplete="email"
                            autoFocus={!isSignUp}
                        />
                    </div>

                    {/* Password */}
                    <div className="login-field">
                        <label htmlFor="login-password">
                            Password
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                setError("");
                            }}
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="login-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        className="login-submit"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        <span>
                            {isSubmitting
                                ? (isSignUp ? "Creating account..." : "Signing in...")
                                : (isSignUp ? "Create account" : "Sign In")}
                        </span>

                        {!isSubmitting && (
                            <span aria-hidden="true">
                                →
                            </span>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <span>
                        {isSignUp ? "Already have an account?" : "New to SyncSpace?"}
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp((current) => !current);
                            setError("");
                        }}
                    >
                        {isSignUp ? "Sign in" : "Create an account"}
                    </button>
                </div>

                {/* Security */}
                <p className="login-security">
                    <span>◆</span>
                    Secure workspace access
                </p>
            </section>
        </div>
    );
}