import { io } from "socket.io-client";

const socket = io("http://localhost:54321", {
    withCredentials: true
});

export default socket;