
import { useEffect, useState } from "react";
import AuthCard from "../components/auth/Authcard";
import "./Login.css";
import socket from "../socket";

export default function Login() {
    const [mode, setMode] = useState("login");

    // Listen for Socket.IO connection status
    useEffect(() => {
        socket.on("connect", () => {
            console.log("SOCKET CONNECTED:", socket.id);
        });

        socket.on("connect_error", (error) => {
            console.error("SOCKET AUTH FAILED:", error.message);
        });

        // Cleanup listeners when Login page is removed
        return () => {
            socket.off("connect");
            socket.off("connect_error");
        };
    }, []);

    const handleAuthSubmit = async (formData) => {
        try {
            // =========================
            // SIGNUP
            // =========================
            if (mode === "signup") {
                const response = await fetch(
                    "http://localhost:54321/api/auth/register",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({
                            name: formData.name,
                            email: formData.email,
                            password: formData.password,
                            role: formData.role,
                        }),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error("Signup failed:", data);
                    alert(data.message || "Signup failed");
                    return;
                }

                console.log("Signup successful:", data);

                // After successful signup,
                // switch the card back to login.
                setMode("login");

                return;
            }

            // =========================
            // LOGIN
            // =========================
            const response = await fetch(
                "http://localhost:54321/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("Login failed:", data);
                alert(data.message || "Login failed");
                return;
            }

            console.log("Login successful:", data);

            // Login succeeded and the backend has set
            // the JWT HTTP-only cookie.
            //
            // Now start the Socket.IO connection.
            socket.connect();

        } catch (error) {
            console.error("Authentication error:", error);
        }
    };

    return (
        <main className="login-page">
            <AuthCard
                mode={mode}
                setMode={setMode}
                onSubmit={handleAuthSubmit}
            />
        </main>
    );
}

