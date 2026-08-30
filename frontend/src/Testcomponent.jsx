import { io } from "socket.io-client";

function App() {
    return (
        <div>
            <h1>SyncSpace</h1>

            <button onClick={() => {
                const socket = io("http://localhost:54321", {
                    withCredentials: true
                });

                socket.on("connect", () => {
                    console.log("Socket connected:", socket.id);
                });

                socket.on("connect_error", (error) => {
                    console.log("Socket connection error:", error.message);
                });
            }}>
                Connect Socket
            </button>
        </div>
    );
}

export default App;