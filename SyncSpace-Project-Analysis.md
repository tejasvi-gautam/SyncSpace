# SyncSpace Project Analysis

**Analysis date:** 21 August 2026  
**Repository:** `SyncSpace`  
**Scope:** All files under `backend/` and `frontend/`, plus the repository ignore file and recent Git history.

## 1. Executive Summary

SyncSpace is a small two-package JavaScript application intended to support real-time collaborative interview workspaces. The backend is an ES-module Express API backed by MongoDB through Mongoose. It currently implements health checks and an authentication slice: registration, login, bcrypt password hashing, JWT creation, HTTP-only cookie storage, request validation, and role-aware middleware. The dependency list also anticipates Socket.IO collaboration, but no socket server or collaboration API is currently wired.

The frontend is a Vite + React 19 application. Its active entry point renders a single-screen join/create-room experience and an in-memory workspace view. The intended workspace imports `Whiteboard` and `CodeEditor` components, but `frontend/src/components/` is absent from the supplied repository. Therefore the current production build cannot resolve the active imports. `Home.jsx` and `Room.jsx` represent a second router-based UI path, but React Router is not listed as a dependency and these components are not imported by the active `App.jsx`.

## 2. Repository Inventory

### Top-level files and folders

| Path | Role |
|---|---|
| `.gitignore` | Excludes dependencies, environment files, build output, logs, and IDE metadata. |
| `backend/` | Independent Node.js/Express API package. |
| `frontend/` | Independent Vite/React client package. |

### Backend files

| File | Purpose and key logic |
|---|---|
| `backend/package.json` | Declares an ES-module Node package. Scripts run the server with Node or Nodemon. Runtime libraries include Express, Mongoose, dotenv, CORS, cookie-parser, bcrypt/bcryptjs, JWT, Zod, and Socket.IO. `bcrypt`, `body`, `body-parser`, `parser`, and `socket.io` are declared but not used by the current source path. |
| `backend/package-lock.json` | npm lockfile v3. Pins the resolved backend dependency tree and records integrity metadata for reproducible installs. It does not contain application logic. |
| `backend/src/server.js` | Composition root. Loads environment variables, creates the Express app, enables CORS, JSON parsing, and cookies, mounts `/api/auth`, defines `/` and `/api/health`, connects to MongoDB, and starts listening on `PORT` or `54321`. |
| `backend/src/config/db.js` | Database adapter. Calls `mongoose.connect(process.env.MONGO_URI)`. Logs success; logs the failure message and terminates the process with exit code 1 on connection failure. |
| `backend/src/routes/auth.routes.js` | Express router for `POST /api/auth/register` and `POST /api/auth/login`. Each route composes a Zod validation middleware with its controller. |
| `backend/src/controllers/auth.controllers.js` | HTTP layer. `register` delegates to `registerUser` and returns status 201 with a safe user object. `login` delegates to `loginUser`, stores the resulting JWT in an HTTP-only `token` cookie, and returns a success message. Both map thrown errors to status 400. |
| `backend/src/services/auth.services.js` | Business/data layer. `registerUser` checks email uniqueness, hashes the password, saves a user, and returns only id/name/email/role. `loginUser` finds the email, compares the plaintext password with the stored hash, and returns a signed token. |
| `backend/src/models/user.models.js` | Mongoose schema/model. A user requires name, unique email, hashed password, and role (`interviewer` or `interviewee`); avatar is optional. Timestamps add `createdAt` and `updatedAt`. |
| `backend/src/schemas/auth.schemas.js` | Input contract. Registration normalizes email to lowercase, validates name, enforces an 8-character password with upper/lowercase, number, and special character, and restricts role. Login validates email and minimum password length. |
| `backend/src/middleware/validate.middleware.js` | Higher-order middleware factory. Runs `schema.safeParse(req.body)`, returns all issue messages with status 400 on failure, or replaces `req.body` with parsed/normalized data and calls `next()`. |
| `backend/src/middleware/auth.middleware.js` | Authentication guard. Reads `req.cookies.token`, verifies it, assigns the decoded JWT to `req.user`, and rejects missing/invalid/expired tokens with status 401. It is defined but not currently mounted on a protected route. |
| `backend/src/middleware/role.middleware.js` | Authorization guard factory. Compares `req.user.role` with the required role and returns status 403 when they differ. It is currently unused. |
| `backend/src/utils/jwt.js` | JWT utility. Builds a payload containing `userId` and `role`, signs it with `JWT_SECRET` and `JWT_EXPIRES_IN`, and wraps verification failures in a consistent error. |

### Frontend files

| File | Purpose and key logic |
|---|---|
| `frontend/package.json` | Declares a private Vite package using React and React DOM. Scripts provide dev server, production build, ESLint, and preview. React Router, Socket.IO client, and whiteboard/editor libraries are not declared. |
| `frontend/package-lock.json` | npm lockfile v3 for the React/Vite toolchain and its transitive packages. |
| `frontend/index.html` | Browser shell. Provides the `root` mount element, viewport metadata, a favicon reference, and loads `/src/main.jsx`. The document title is still the template value `frontend`. |
| `frontend/vite.config.js` | Vite configuration. Enables the official React plugin and otherwise uses Vite defaults. |
| `frontend/eslint.config.js` | Flat ESLint configuration. Ignores `dist`, applies recommended JavaScript rules, React Hooks rules, React Refresh rules, and browser globals to `.js`/`.jsx` files. |
| `frontend/README.md` | Unmodified Vite template guidance covering the React plugin choices and optional React Compiler. It does not document SyncSpace setup or API usage. |
| `frontend/src/main.jsx` | Client bootstrap. Imports global CSS, renders `App` inside React `StrictMode`, and attaches it to `#root`. |
| `frontend/src/App.jsx` | Active application component. Holds `name`, `roomId`, and `joined` state. `joinRoom` requires name and room ID; `createRoom` generates a six-character uppercase base-36 ID and joins when a name exists. Before joining it renders the hero/form page. After joining it renders a navbar, room canvas, code-editor slot, collaborator panel, room details, copy-room-ID action, and leave action. It imports missing `./components/Whiteboard` and `./components/CodeEditor`. |
| `frontend/src/Home.jsx` | Alternate, currently disconnected join page. Uses `useNavigate` from React Router, validates username/room ID, stores username in local storage, then navigates to `/room/:roomId`. The package does not include React Router and `App.jsx` does not import this component. |
| `frontend/src/Room.jsx` | Alternate, currently disconnected room page. Reads `roomId` with `useParams`, shows a header, and renders `Whiteboard` without passing the room ID. It also depends on missing router/component infrastructure. |
| `frontend/src/index.css` | Global and alternate-room styling. Defines color/type variables, full-height layout rules, room header/content, whiteboard container, toolbar, canvas, text editor, and responsive rules. It contains overlapping toolbar selectors and a malformed-looking repeated selector block near the mobile rules, which should be cleaned when the component implementation is restored. |
| `frontend/src/App.css` | Main visual design stylesheet. Defines the dark gradient landing page, blurred circle decoration, navbar, hero, feature list, join card, form controls, buttons, footer, responsive layout, and the whiteboard workspace/navbar/panel styles. It contains duplicate toolbar rules because the active and alternate whiteboard designs were combined. |
| `frontend/src/assets/hero.png` | Raster visual asset. Present in the repository but not imported by the current React code. |
| `frontend/src/assets/react.svg` | Vite starter asset. Not imported by the current code. |
| `frontend/src/assets/vite.svg` | Vite starter asset. Not imported by the current code. |
| `frontend/public/favicon.svg` | Public favicon referenced from `index.html`. |
| `frontend/public/icons.svg` | Public SVG asset. No current source import was found. |

## 3. Dependencies and External Services

### Backend

- **Express 5:** HTTP server and routing.
- **Mongoose 9:** MongoDB connection, schema, model, persistence.
- **dotenv:** Loads `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `saltRounds`, and `PORT` from environment variables.
- **cors:** Adds CORS middleware with default configuration.
- **cookie-parser:** Makes the login cookie available as `req.cookies.token`.
- **bcryptjs:** Password hashing and verification. The separate native `bcrypt` package is also declared but unused.
- **jsonwebtoken:** Signs and verifies authentication tokens.
- **zod:** Runtime request-body validation and email normalization.
- **Socket.IO:** Declared as a dependency but not initialized in `server.js`.

### Frontend

- **React 19 / React DOM 19:** Component rendering and local state.
- **Vite 8:** Dev server and production bundling.
- **@vitejs/plugin-react:** React transform/HMR integration.
- **ESLint plus React Hooks/Refresh plugins:** Static analysis.
- **No API client layer:** The active frontend does not call `/api/auth` or `/api/health`.
- **No realtime client:** The active frontend does not use Socket.IO or WebSocket APIs.

## 4. Architecture

The intended architecture is a layered client/server application:

```text
Browser
  |
  | Vite-served React UI
  v
frontend/src/main.jsx -> App.jsx
  |                         |
  | intended HTTP calls      | intended realtime workspace
  v                         v
Express API              Socket.IO (declared, not wired)
backend/src/server.js
  |
  +--> auth.routes.js
          |
          +--> validate.middleware.js + Zod schemas
          |
          +--> auth.controllers.js
                  |
                  +--> auth.services.js
                          |
                          +--> User model -> MongoDB
                          +--> JWT utility -> token cookie
```

### Current implemented boundary

```text
POST /api/auth/register
  -> CORS/JSON/cookie middleware
  -> validate(registerSchema)
  -> register controller
  -> registerUser service
  -> User.findOne / bcrypt.hash / User.save
  -> safe user JSON

POST /api/auth/login
  -> CORS/JSON/cookie middleware
  -> validate(loginSchema)
  -> login controller
  -> loginUser service
  -> User.findOne / bcrypt.compare / generateToken
  -> HTTP-only token cookie + success JSON
```

### Health flow

```text
GET /
  -> { message: "SyncSpace server is running" }

GET /api/health
  -> inspect mongoose.connection.readyState
  -> { message, db_status: "db_connected" | "db_not_connected" }
```

### Frontend state flow

```text
Initial state: name="", roomId="", joined=false
             |
             +--> Join Workspace
             |      validate both fields
             |      joined=true
             |
             +--> Create New Room
                    generate uppercase random ID
                    require name
                    joined=true

joined=false ----------------------> landing/join view
joined=true  ----------------------> workspace view
Leave button -----------------------> joined=false
Copy Room ID -----------------------> clipboard.writeText(roomId)
```

## 5. Design Patterns and Framework Conventions

- **Layered backend:** routes, middleware, controllers, services, models, and utilities have separate responsibilities.
- **Middleware pipeline:** Express composes cross-cutting concerns before controller execution.
- **Higher-order middleware:** `validate(schema)` and `requireRole(role)` return request handlers configured for a specific contract or role.
- **Repository/model pattern:** Mongoose `User` encapsulates the MongoDB document shape and persistence operations.
- **Stateless token payload:** JWT carries `userId` and `role`; the server does not store a session record in this code.
- **React functional components and hooks:** UI state is managed with `useState`; the active component uses conditional rendering instead of a router.
- **CSS class-based styling:** Presentation is separated into global and component stylesheet files.

## 6. Colleague's Contributions

The Git history attributes the visible work to a sequence of incremental setup, authentication, cleanup, and frontend-upload commits. Because commit authorship metadata was not requested and the history shown here has no contributor names in the summary, this section describes the contribution represented by the commits rather than assigning personal names.

### Features implemented

- Initialized the SyncSpace project and basic backend server.
- Added authentication utilities and controller/service structure.
- Added user registration and login routes.
- Added password hashing and password comparison through `bcryptjs`.
- Added JWT generation and cookie-based login handling.
- Added Zod registration/login validation.
- Added role middleware for future interviewer/interviewee authorization.
- Added backend health endpoints and MongoDB connection startup.
- Added a polished React join/create-room experience and an in-memory workspace shell.
- Added responsive CSS for the landing view and intended whiteboard layout.

### Challenges addressed

- Separated HTTP concerns from authentication business logic.
- Prevented plaintext passwords from being returned by constructing a safe registration response.
- Normalized registration email input before persistence.
- Added consistent invalid-credential and token-error responses.
- Added fail-fast database startup behavior.
- Removed the temporary `backend/src/controllers/teja.js` file in the latest cleanup commits.

### Remaining integration challenges

- The active React entry cannot build because `Whiteboard` and `CodeEditor` are absent.
- Authentication is not connected from the frontend to the backend.
- No room persistence, Socket.IO server, editor synchronization, or collaborator presence implementation exists in the supplied files.
- The alternate router-based UI is incomplete because React Router is not installed or mounted.
- Production cookie/CORS settings need environment-aware configuration before deployment.

## 7. Verification Evidence

Commands were run from the package directories:

```text
cd frontend && npm run lint
  PASS

cd frontend && npm run build
  FAIL
  Could not resolve './components/Whiteboard' in src/App.jsx
  Could not resolve './components/CodeEditor' in src/App.jsx
```

The root directory intentionally has no `package.json`, so package scripts must be run separately in `backend/` and `frontend/`.

## 8. Risks and Recommended Next Steps

1. Restore or implement `frontend/src/components/Whiteboard.jsx` and `frontend/src/components/CodeEditor.jsx`, or remove those imports until the components exist.
2. Choose one navigation approach: keep the current conditional `App.jsx` flow or install/configure React Router and make `Home`/`Room` the routed entry.
3. Add a frontend API client and connect registration/login to `/api/auth` with credentials enabled for cookies.
4. Configure CORS with an explicit frontend origin and set `secure: true` for HTTPS deployments.
5. Validate `saltRounds`, JWT settings, and required environment variables at startup rather than allowing undefined configuration to reach hashing/signing.
6. Remove unused backend dependencies and duplicate toolbar CSS once the collaboration design is settled.
7. Add tests for validation, duplicate registration, invalid login, cookie issuance, token expiry, role authorization, and health status.
8. Initialize Socket.IO only when room synchronization requirements are defined, then add room membership, canvas events, code events, and presence events.

## 9. Key Takeaways

- SyncSpace is a **two-package monorepo**: Vite/React frontend plus Express/Mongoose backend.
- The backend's strongest completed slice is **authentication**, not collaboration.
- Registration uses **Zod -> controller -> service -> Mongoose** and stores a bcrypt hash.
- Login returns a **JWT in an HTTP-only cookie**; protected routes are prepared but not yet present.
- The database is MongoDB through Mongoose and must connect before the server listens.
- The active frontend is an **in-memory prototype** for room joining and workspace presentation.
- The current build is blocked by missing `Whiteboard` and `CodeEditor` modules.
- Socket.IO is listed but currently unused, so “real-time” is a product intention rather than an implemented backend behavior.
- `Home.jsx` and `Room.jsx` are alternate, disconnected router-oriented components.
- The next high-value task is to resolve the frontend component/navigation split, then wire API and realtime behavior.
-sdfghjkl;