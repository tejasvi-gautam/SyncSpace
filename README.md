# SyncSpace

SyncSpace is a React + Vite collaborative technical interview workspace with a landing page, whiteboard room, and shared code editor.

## Run the frontend

From the project root:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The root install script also installs the dependencies inside `frontend`, so the project can be shared as a zip without committing `node_modules`.

## Frameworks

- React 19
- Vite
- React Router
- Zustand and Socket.IO client are available for the collaborative state and backend integration

The frontend can be explored without the backend. Starting the backend separately enables authentication and real-time Socket.IO connectivity.
