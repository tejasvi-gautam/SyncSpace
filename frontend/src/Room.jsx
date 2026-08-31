import { useParams } from "react-router-dom";
import Whiteboard from "./components/Whiteboard";

function Room() {
    const { roomId } = useParams();

    return (
        <div className="room-page">
            <header className="room-header">
                <h1>SyncSpace</h1>

                <div className="room-info">
                    Room: <strong>{roomId}</strong>
                </div>
            </header>

            <main className="room-content">
                <Whiteboard roomId={roomId} />
            </main>
        </div>
    );
}

export default Room;