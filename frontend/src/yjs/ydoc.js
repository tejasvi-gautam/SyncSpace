import * as Y from "yjs";

const ydoc = new Y.Doc();

// Collaborative source code
const code = ydoc.getText("code");

// Collaborative whiteboard objects
const whiteboard = ydoc.getArray("whiteboard");

// Room-level metadata/settings
const room = ydoc.getMap("room");
console.log("Yjs document:", ydoc);
console.log("Code:", code.toString());
console.log("Whiteboard:", whiteboard.toJSON());
console.log("Room:", room.toJSON());

export {
    ydoc,
    code,
    whiteboard,
    room,
};
