const roomUsers = new Map();
const roomCode = new Map();//keep track of room programming codes and their corresponding room IDs
export const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // ==========================================
        // JOIN ROOM
        // ==========================================

        socket.on("join-room", (roomId) => {
            if (!roomId) return;
            if(!roomUsers.has(roomId)) {
                roomUsers.set(roomId, new Map());
            }
            roomUsers.get(roomId).set(socket.id, {
                socketId: socket.id,
                userId: socket.user.id,
                name:socket.user.name
            });
            socket.join(roomId);
            const usersInRoom = Array.from(roomUsers.get(roomId).values());
            io.to(roomId).emit("room-users", usersInRoom);

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
            "whiteboard-event",//execute this at whenever client sneds me some event called a whiteboard event
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
        //========================================
        // DRAWING EVENT FOR CONNECTION PRESENCE EVENTS
        //========================================
        socket.on("drawing-start", (roomId) => {
            if (!roomId) return;

            const users = roomUsers.get(roomId);

            if (!users || !users.has(socket.id)) return;

            socket.to(roomId).emit("drawing-start", {
                socketId: socket.id,
                userId: socket.user.id,
                name: socket.user.name
            });
        });
        socket.on("drawing-stop", (roomId) => {
            if (!roomId) return;

            const users = roomUsers.get(roomId);

            if (!users || !users.has(socket.id)) return;

            socket.to(roomId).emit("drawing-stop", {
                socketId: socket.id,
                userId: socket.user.id,
                name: socket.user.name
            });
        });
        socket.on("cursor-position", ({ roomId, x, y }) => {
            if (!roomId) return;

            const users = roomUsers.get(roomId);

            if (!users || !users.has(socket.id)) return;

            socket.to(roomId).emit("cursor-position", {
                socketId: socket.id,
                userId: socket.user.id,
                name: socket.user.name,
                x,
                y
            });
        });
        // ==========================================
        // DISCONNECT
        // ==========================================

    socket.on("disconnect", () => {
    for (const [roomId, users] of roomUsers.entries()) {
        if (!users.has(socket.id)) continue;

        users.delete(socket.id);

        if (users.size === 0) {//delete room if no users in that
            roomUsers.delete(roomId);
            continue;
        }

        const usersInRoom = Array.from(users.values());

        io.to(roomId).emit("room-users", usersInRoom);
    }

    console.log(`${socket.id} disconnected`);
    });
    });
};