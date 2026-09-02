import { useParams } from "react-router-dom";
import Whiteboard from "./components/Whiteboard";

function Room() {
    const { roomId } = useParams();

    return (
        <Whiteboard
            roomId={roomId}
        />
    );
}

export default Room;