import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");

    const navigate = useNavigate();

    const joinRoom = () => {
        if (username.trim() === "") {
            alert("Please enter your name");
            return;
        }

        if (roomId.trim() === "") {
            alert("Please enter Room ID");
            return;
        }

        localStorage.setItem("username", username);

        navigate(`/room/${roomId}`);
    };

    return (
        <div className="home-page">

            <div className="home-card">

                <h1>SyncSpace</h1>

                <p>
                    Real-Time Collaborative Whiteboard
                </p>

                <label>Your Name</label>

                <input
                    type="text"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label>Room ID</label>

                <input
                    type="text"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                />

                <button onClick={joinRoom}>
                    Join Room
                </button>

            </div>

        </div>
    );
}

export default Home;