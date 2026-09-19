
import * as Y from "yjs";
import socket from "../socket";

const ydoc = new Y.Doc();

const code = ydoc.getText("code");
const whiteboard = ydoc.getArray("whiteboard");
const room = ydoc.getMap("room");

/*
 * Prevent receiving our own update and
 * immediately sending it back.
 */
let applyingRemoteUpdate = false;

/*
 * Local Yjs change
 *
 * Whenever Y.Doc changes locally,
 * encode the change and send it
 * through Socket.IO.
 */
ydoc.on("update", (update, origin) => {
    if (origin === "remote") {
        return;
    }

    if (applyingRemoteUpdate) {
        return;
    }

    socket.emit("yjs-update", {
        roomId: room.get("roomId"),
        update: Array.from(update),
    });
});

/*
 * Receive Yjs update from server.
 */
socket.on(
    "yjs-update",
    ({ update }) => {
        if (!update) {
            return;
        }

        try {
            applyingRemoteUpdate = true;

            Y.applyUpdate(
                ydoc,
                new Uint8Array(update),
                "remote"
            );
        } finally {
            applyingRemoteUpdate = false;
        }
    }
);

console.log(
    "Yjs document:",
    ydoc
);

console.log(
    "Code:",
    code.toString()
);

console.log(
    "Whiteboard:",
    whiteboard.toJSON()
);

console.log(
    "Room:",
    room.toJSON()
);

export {
    ydoc,
    code,
    whiteboard,
    room,
};

