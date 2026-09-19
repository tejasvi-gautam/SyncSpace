
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);

    const [name, setName] = useState(
        localStorage.getItem("syncspace_username") || ""
    );

    const [email, setEmail] = useState(
        localStorage.getItem("syncspace_email") || ""
    );

    const [password, setPassword] = useState("");

    const [role, setRole] = useState(
        localStorage.getItem("syncspace_role") || "interviewee"
    );

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:54321";

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // -------------------------
        // FRONTEND VALIDATION
        // -------------------------

        if (isSignUp && !cleanName) {
            setError("Please enter your name.");
            return;
        }

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

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (
            isSignUp &&
            (
                !/[A-Z]/.test(password) ||
                !/[a-z]/.test(password) ||
                !/[0-9]/.test(password) ||
                !/[^A-Za-z0-9]/.test(password)
            )
        ) {
            setError(
                "Password needs uppercase, lowercase, number and special character."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            // -------------------------
            // REGISTER
            // -------------------------

            if (isSignUp) {
                const registerResponse = await fetch(
                    `${apiUrl}/api/auth/register`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({
                            name: cleanName,
                            email: cleanEmail,
                            password,
                            role,
                        }),
                    }
                );

                const registerData =
                    await registerResponse.json();

                if (!registerResponse.ok) {
                    throw new Error(
                        registerData.message ||
                        registerData.errors?.join(" ") ||
                        "Unable to create your account."
                    );
                }
            }

            // -------------------------
            // LOGIN
            // -------------------------

            const loginResponse = await fetch(
                `${apiUrl}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: cleanEmail,
                        password,
                    }),
                }
            );

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                throw new Error(
                    loginData.message ||
                    loginData.errors?.join(" ") ||
                    "Unable to sign in."
                );
            }

            // -------------------------
            // AUTHENTICATION SUCCESS
            // -------------------------

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
                loginData.user?.name ||
                cleanName ||
                cleanEmail.split("@")[0]
            );

            localStorage.setItem(
                "syncspace_role",
                loginData.user?.role || role
            );

            // -------------------------
            // GO TO HOME
            // -------------------------

            navigate("/home");
        } catch (err) {
            setError(
                err.message ||
                (
                    isSignUp
                        ? "Unable to create your account."
                        : "Unable to sign in."
                )
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp((current) => !current);
        setError("");
        setPassword("");
    };

    return (
        <main className="login-page">
            <div
                className="login-background"
                aria-hidden="true"
            >
                <div className="login-glow login-glow-one" />
                <div className="login-glow login-glow-two" />
                <div className="login-grid" />
            </div>

            <header className="login-header">
                <Link
                    className="login-brand"
                    to="/"
                >
                    <span className="login-brand-mark">
                        S
                    </span>

                    <span>
                        <strong>SyncSpace</strong>
                        <small>
                            Collaborate with clarity
                        </small>
                    </span>
                </Link>

                <Link
                    className="login-back-link"
                    to="/"
                >
                    Back to SyncSpace
                    <span aria-hidden="true">
                        ↗
                    </span>
                </Link>
            </header>

            <section className="login-layout">
                <div className="login-story">
                    <p className="login-kicker">
                        {isSignUp
                            ? "GET STARTED"
                            : "WELCOME BACK"}
                    </p>

                    <h1>
                        Make the thinking visible.
                    </h1>

                    <p className="login-story-copy">
                        Access your collaborative interview
                        workspace where your whiteboard and
                        code stay together in real time.
                    </p>

                    <div className="login-proof-list">
                        <div>
                            <span>01</span>

                            <p>
                                <strong>
                                    One shared canvas
                                </strong>
                                <br />
                                Sketch systems and ideas
                                together in real time.
                            </p>
                        </div>

                        <div>
                            <span>02</span>

                            <p>
                                <strong>
                                    Code beside the diagram
                                </strong>
                                <br />
                                Keep the solution and the
                                reasoning in view.
                            </p>
                        </div>

                        <div>
                            <span>03</span>

                            <p>
                                <strong>
                                    Secure workspace access
                                </strong>
                                <br />
                                Authenticate before joining
                                any collaborative room.
                            </p>
                        </div>
                    </div>
                </div>

                <section
                    className="login-card"
                    aria-labelledby="login-title"
                >
                    <div className="login-card-top">
                        <div className="login-card-icon">
                            S
                        </div>

                        <span className="login-live">
                            <i />
                            Secure access
                        </span>
                    </div>

                    <p className="login-card-kicker">
                        {isSignUp
                            ? "CREATE YOUR ACCOUNT"
                            : "SIGN IN TO SYNCSPACE"}
                    </p>

                    <h2 id="login-title">
                        {isSignUp
                            ? "Create your account"
                            : "Sign in to SyncSpace"}
                    </h2>

                    <p className="login-card-intro">
                        {isSignUp
                            ? "Create an account to access your collaborative interview workspace."
                            : "Sign in to continue to your SyncSpace workspace."}
                    </p>

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >
                        {isSignUp && (
                            <label>
                                Your name

                                <input
                                    type="text"
                                    placeholder="Alex Morgan"
                                    autoComplete="name"
                                    value={name}
                                    onChange={(event) => {
                                        setName(
                                            event.target.value
                                        );
                                        setError("");
                                    }}
                                    required
                                />
                            </label>
                        )}

                        <label>
                            Email address

                            <input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                required
                            />
                        </label>

                        <label>
                            Password

                            <input
                                type="password"
                                placeholder="Enter your password"
                                autoComplete={
                                    isSignUp
                                        ? "new-password"
                                        : "current-password"
                                }
                                value={password}
                                onChange={(event) => {
                                    setPassword(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                required
                            />
                        </label>

                        {isSignUp && (
                            <label>
                                I am joining as

                                <select
                                    value={role}
                                    onChange={(event) =>
                                        setRole(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="interviewee">
                                        Interviewee
                                    </option>

                                    <option value="interviewer">
                                        Interviewer
                                    </option>
                                </select>
                            </label>
                        )}

                        {error && (
                            <p
                                className="login-status error"
                                role="alert"
                                aria-live="polite"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            className="login-submit"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            <span>
                                {isSubmitting
                                    ? isSignUp
                                        ? "Creating account..."
                                        : "Signing in..."
                                    : isSignUp
                                        ? "Create account"
                                        : "Sign In"}
                            </span>

                            {!isSubmitting && (
                                <strong aria-hidden="true">
                                    →
                                </strong>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <span>
                            {isSignUp
                                ? "Already have an account?"
                                : "New to SyncSpace?"}
                        </span>

                        <button
                            type="button"
                            onClick={toggleMode}
                        >
                            {isSignUp
                                ? "Sign in"
                                : "Create an account"}
                        </button>
                    </div>

                    <p className="login-security">
                        <span>◆</span>
                        Authenticated workspace access
                    </p>
                </section>
            </section>
        </main>
    );
}

