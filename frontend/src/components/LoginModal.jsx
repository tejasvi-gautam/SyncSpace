import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginModal.css";

export default function LoginModal({ onClose }) {
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        localStorage.getItem("syncspace_email") || ""
    );

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);

        try {
            /*
             * Mock login
             *
             * This simulates a successful login.
             * Replace this section with your backend API
             * when real authentication is ready.
             */

            await new Promise((resolve) =>
                setTimeout(resolve, 700)
            );

            // Save login information
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
                cleanEmail.split("@")[0]
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
            setError(
                "Unable to sign in. Please try again."
            );
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
                    WELCOME BACK
                </p>

                <h2 id="login-title">
                    Sign in to SyncSpace
                </h2>

                <p className="login-description">
                    Continue to your collaborative
                    interview workspace.
                </p>

                {/* Login form */}
                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
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
                            autoFocus
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
                                ? "Signing in..."
                                : "Sign In"}
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
                        New to SyncSpace?
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            setError(
                                "Account creation will be available soon."
                            );
                        }}
                    >
                        Create an account
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