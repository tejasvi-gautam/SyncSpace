import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Login.css";

const createRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function Login() {
    const navigate = useNavigate();
    const [name, setName] = useState(localStorage.getItem("syncspace_username") || "");
    const [roomId, setRoomId] = useState(localStorage.getItem("syncspace_room") || "");
    const [role, setRole] = useState("Candidate");
    const [error, setError] = useState("");

    const enterRoom = (event) => {
        event.preventDefault();
        const cleanName = name.trim();
        const cleanRoomId = roomId.trim().toUpperCase();

        if (!cleanName || !cleanRoomId) {
            setError("Enter your name and a Room ID to continue.");
            return;
        }

        localStorage.setItem("syncspace_username", cleanName);
        localStorage.setItem("syncspace_room", cleanRoomId);
        localStorage.setItem("syncspace_role", role);
        navigate(`/room/${cleanRoomId}`);
    };

    const createRoom = () => {
        const cleanName = name.trim();
        if (!cleanName) {
            setError("Enter your name before creating a room.");
            return;
        }

        const newRoomId = createRoomId();
        localStorage.setItem("syncspace_username", cleanName);
        localStorage.setItem("syncspace_room", newRoomId);
        localStorage.setItem("syncspace_role", role);
        navigate(`/room/${newRoomId}`);
    };

    return (
        <main className="login-page">
            <div className="login-background" aria-hidden="true">
                <div className="login-glow login-glow-one" />
                <div className="login-glow login-glow-two" />
                <div className="login-grid" />
            </div>

            <header className="login-header">
                <Link className="login-brand" to="/">
                    <span className="login-brand-mark">S</span>
                    <span>
                        <strong>SyncSpace</strong>
                        <small>Collaborate with clarity</small>
                    </span>
                </Link>
                <Link className="login-back-link" to="/home">
                    Explore SyncSpace <span aria-hidden="true">↗</span>
                </Link>
            </header>

            <section className="login-layout">
                <div className="login-story">
                    <p className="login-kicker">YOUR ROOM IS READY</p>
                    <h1>Make the thinking visible.</h1>
                    <p className="login-story-copy">
                        Join a focused interview room with your name and a Room ID. No account or password required.
                    </p>
                    <div className="login-proof-list">
                        <div><span>01</span><p><strong>One shared canvas</strong><br />Sketch systems and ideas together in real time.</p></div>
                        <div><span>02</span><p><strong>Code beside the diagram</strong><br />Keep the solution and the reasoning in view.</p></div>
                        <div><span>03</span><p><strong>Simple room access</strong><br />Share the Room ID with anyone you want to invite.</p></div>
                    </div>
                </div>

                <section className="login-card" aria-labelledby="login-title">
                    <div className="login-card-top">
                        <div className="login-card-icon">S</div>
                        <span className="login-live"><i />Room access online</span>
                    </div>

                    <p className="login-card-kicker">JOIN YOUR WORKSPACE</p>
                    <h2 id="login-title">Enter the interview room</h2>
                    <p className="login-card-intro">Use the details shared by your interviewer to continue.</p>

                    <form className="login-form" onSubmit={enterRoom}>
                        <label>
                            Your name
                            <input type="text" placeholder="Alex Morgan" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} required />
                        </label>
                        <label>
                            Room ID
                            <input type="text" placeholder="e.g. Q7K2M9" maxLength={6} value={roomId} onChange={(event) => { setRoomId(event.target.value.toUpperCase()); setError(""); }} required />
                        </label>
                        <label>
                            I am joining as
                            <select value={role} onChange={(event) => setRole(event.target.value)}>
                                <option>Candidate</option>
                                <option>Interviewer</option>
                            </select>
                        </label>

                        <button className="login-submit" type="submit">
                            <span>Enter whiteboard</span>
                            <strong aria-hidden="true">→</strong>
                        </button>
                        <p className="login-status error" role="alert" aria-live="polite">{error}</p>
                    </form>

                    <div className="login-divider"><span />or<span /></div>
                    <button className="login-secondary" type="button" onClick={createRoom}>Create a new room</button>
                    <p className="login-security"><span>◆</span> Guest access · room details stay on this device</p>
                </section>
            </section>
        </main>
    );
}