import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Landing from "../components/Landing";

function Home() {
    const [username, setUsername] = useState(
        localStorage.getItem("syncspace_username") || ""
    );
    const [roomId, setRoomId] = useState("");

    const navigate = useNavigate();

    const joinRoom = () => {
        const cleanUsername = username.trim();
        const cleanRoomId = roomId.trim().toUpperCase();

        if (!cleanUsername) {
            alert("Please enter your name");
            return;
        }

        if (!cleanRoomId) {
            alert("Please enter Room ID");
            return;
        }

        localStorage.setItem("syncspace_username", cleanUsername);
        localStorage.setItem("syncspace_room", cleanRoomId);

        navigate(`/room/${cleanRoomId}`);
    };

    const createRoom = () => {
        const cleanUsername = username.trim();

        if (!cleanUsername) {
            alert("Please enter your name");
            return;
        }

        const newRoomId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        localStorage.setItem("syncspace_username", cleanUsername);
        localStorage.setItem("syncspace_room", newRoomId);

        navigate(`/room/${newRoomId}`);
    };

    return (
        <Landing
            name={username}
            setName={setUsername}
            roomId={roomId}
            setRoomId={setRoomId}
            handleJoin={joinRoom}
            handleCreate={createRoom}
            navigate={navigate}
        />
    );
}

export default Home;