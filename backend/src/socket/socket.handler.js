const roomUsers = new Map();
export const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // ==========================================
        // JOIN ROOM
        // ==========================================

        socket.on("join-room", (roomId) => {
            if (!roomId) return;
            if(!roomUsers.has(roomId)) {
                roomUsers.set(roomId, new Set());
            }
            roomUsers.get(roomId).add(socket.id,{
                SocketId: socket.id,
                userId: socket.userId,
                name:socket.user.name
            });
            socket.join(roomId);

            console.log(
                `${socket.id} joined room ${roomId}`
            );
        });

        // ==========================================
        // NORMAL ROOM MESSAGE
        // ==========================================

        socket.on(
            "room-message",
            ({ roomId, message }) => {
                if (!roomId) return;

                socket
                    .to(roomId)
                    .emit("room-message", message);
            }
        );

        // ==========================================
        // WHITEBOARD EVENT
        // ==========================================

        socket.on(
            "whiteboard-event",
            ({ roomId, type, item }) => {
                if (!roomId || !type) return;

                console.log(
                    `Whiteboard event: ${type} in room ${roomId}`
                );

                socket.to(roomId).emit(
                    "whiteboard-event",
                    {
                        roomId,
                        type,
                        item,
                    }
                );
            }
        );

        // ==========================================
        // DISCONNECT
        // ==========================================

        socket.on("disconnect", () => {
            console.log(
                "Socket disconnected:",
                socket.id
            );
        });
    });
};