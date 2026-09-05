import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Whiteboard from "./components/Whiteboard";

function Room() {
    const { roomId } =
        useParams();

    const userName = useMemo(() => {
        return (
            localStorage.getItem(
                "syncspace_name"
            ) ||
            localStorage.getItem(
                "syncspace_user_name"
            ) ||
            "Guest"
        );
    }, []);

    return (
        <Whiteboard
            roomId={roomId}
            userName={userName}
        />
    );
}

export default Room;