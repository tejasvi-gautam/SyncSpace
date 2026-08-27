# Frontend Development Guide

This guide describes a practical workflow for building React frontends. It applies to the current SyncSpace frontend, which uses Vite, React, React Router, Zustand, Socket.IO, and Yjs. Next.js is included as an alternative framework when server rendering, file-based routing, or full-stack features are required.

## 1. Project Setup

### Prerequisites

Install the following tools:

- **Node.js:** Use the current LTS release from [nodejs.org](https://nodejs.org/) or a version manager such as `nvm`.
- **npm:** npm is included with Node.js. Confirm both installations:

```bash
node --version
npm --version
```

For team consistency, record the supported Node.js version in `package.json`:

```json
{
  "engines": {
    "node": ">=20"
  }
}
```

Use the repository's lockfile and install dependencies with:

```bash
npm install
```

### Initialize a React project

For a new Vite application:

```bash
npm create vite@latest my-frontend -- --template react
cd my-frontend
npm install
npm run dev
```

For a project that starts from an empty directory, the basic npm initialization is:

```bash
mkdir my-frontend
cd my-frontend
npm init -y
npm install react react-dom
```

Then add a bundler, such as Vite, and create the application entry point and scripts. Using the Vite generator is recommended because it supplies this configuration automatically.

Common scripts should include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

In the current project, run:

```bash
npm run dev
npm run lint
npm run build
```

### Set up a GitHub repository

Create an empty repository on GitHub, then connect the local project:

```bash
git init
git add .
git commit -m "chore: initialize frontend"
git branch -M main
git remote add origin https://github.com/<organization-or-user>/<repository>.git
git push -u origin main
```

To clone an existing repository instead:

```bash
git clone https://github.com/<organization-or-user>/<repository>.git
cd <repository>/frontend
npm install
```

Do not commit secrets, local environment files, or generated dependencies. Keep `.env*` files in `.gitignore`, except for a documented `.env.example` containing placeholder values.

## 2. Frameworks and Libraries

### React basics

React applications are built from components: small functions that return UI.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}
```

**Components** should have one clear responsibility and use PascalCase names. Keep page-level orchestration separate from reusable presentation components.

**Props** are read-only inputs passed from a parent to a child:

```jsx
function UserCard({ user, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(user.id)}>
      {user.displayName}
    </button>
  );
}
```

**State** represents data that changes over time. Use `useState` for local component state:

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}
```

Use `useEffect` for synchronization with external systems such as subscriptions, timers, or browser APIs. Avoid using effects for values that can be calculated during rendering.

### Next.js setup and routing

Use Next.js when the application needs server-rendered pages, static generation, API routes, or framework-managed routing:

```bash
npx create-next-app@latest my-next-app
cd my-next-app
npm run dev
```

With the App Router, routes are created by directories under `app/`:

```text
app/
  layout.jsx       # Shared layout
  page.jsx         # /
  about/page.jsx   # /about
  rooms/[roomId]/page.jsx  # Dynamic /rooms/:roomId
```

Use `next/link` for internal navigation:

```jsx
import Link from "next/link";

export default function Navigation() {
  return <Link href="/rooms">Rooms</Link>;
}
```

The current SyncSpace frontend uses React Router with Vite. Do not add Next.js solely for client-side routing; keep React Router when Vite is the intended runtime.

### Tailwind CSS integration

Install Tailwind CSS using the setup that matches the project version. For current Vite projects using Tailwind CSS v4:

```bash
npm install tailwindcss @tailwindcss/vite
```

Add the plugin to `vite.config.js`:

```js
import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [tailwindcss()],
};
```

Import Tailwind in the main stylesheet:

```css
@import "tailwindcss";
```

Use utility classes for layout and responsive behavior:

```jsx
export function Panel({ children }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </section>
  );
}
```

Tailwind's responsive prefixes are mobile-first. Start with the narrow layout, then add `sm:`, `md:`, `lg:`, and `xl:` rules as the viewport grows.

### Zustand for state management

Use local React state for component-only concerns. Use Zustand for shared client state such as the active room, authenticated user, connection status, or editor state.

```bash
npm install zustand
```

Create a focused store:

```js
import { create } from "zustand";

export const useRoomStore = create((set) => ({
  roomId: null,
  setRoomId: (roomId) => set({ roomId }),
  clearRoom: () => set({ roomId: null }),
}));
```

Consume only the required slice:

```jsx
const roomId = useRoomStore((state) => state.roomId);
const setRoomId = useRoomStore((state) => state.setRoomId);
```

Keep asynchronous API calls in services or actions rather than scattering them through unrelated components. Do not put short-lived form fields or derived values in a global store.

## 3. Folder Structure

A simple feature-friendly structure is:

```text
src/
  components/       # Reusable UI and domain components
  pages/            # Route-level views
  styles/           # Global styles, tokens, and shared CSS
  store/            # Zustand stores and state selectors
  services/         # API, WebSocket, and external service clients
  hooks/            # Reusable React hooks
  assets/           # Imported images, fonts, and static resources
  App.jsx           # Application shell and route registration
  main.jsx          # Browser entry point
```

The minimum requested structure is:

```text
src/
  components/
  pages/
  styles/
  store/
```

Organize larger features by domain when that improves discoverability:

```text
src/
  features/
    rooms/
      RoomPage.jsx
      room.api.js
      room.store.js
      room.test.jsx
```

Keep imports moving in one direction where possible: shared components should not import page-specific modules, and stores should not depend on UI components.

## 4. Best Practices

### Code formatting and linting

Use one formatter and one lint configuration for the whole repository. Prettier handles formatting; ESLint or Oxlint handles code-quality rules.

```bash
npm install --save-dev prettier eslint
npx prettier . --write
npx eslint .
```

Add scripts so checks are repeatable:

```json
{
  "scripts": {
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "lint": "eslint ."
  }
}
```

The current project uses Oxlint, so run its existing `npm run lint` command unless the team intentionally migrates the lint configuration.

### Build reusable components

- Give each component one clear responsibility.
- Prefer composition and `children` over large components with many boolean props.
- Keep visual components independent from API clients where practical.
- Define accessible names, keyboard behavior, and focus states as part of the component contract.
- Avoid premature abstraction: extract a component when the pattern is repeated or has a meaningful domain boundary.

### Responsive design with Tailwind

- Design from the smallest supported viewport upward.
- Use responsive grid and flex layouts instead of fixed pixel widths.
- Keep touch targets large enough for mobile interaction.
- Test long labels, loading states, empty states, and error messages at narrow widths.
- Use semantic HTML before adding styling classes.
- Check both keyboard navigation and reduced-motion preferences.

### Data fetching and effects

- Represent loading, success, empty, and error states explicitly.
- Cancel or ignore stale requests when a component unmounts or its inputs change.
- Keep server data separate from UI state; do not duplicate the same source of truth.
- Store public configuration in environment variables with a clear prefix, such as `VITE_API_URL`.
- Never expose private keys in browser code.

### Git workflow

Use short-lived branches and focused commits:

```bash
git switch main
git pull --ff-only
git switch -c feature/room-presence
git add src/
git commit -m "feat: show room presence"
git push -u origin feature/room-presence
```

Recommended workflow:

1. Start from an up-to-date `main` branch.
2. Create a branch named `feature/...`, `fix/...`, `docs/...`, or `chore/...`.
3. Keep each commit small and describe the user-visible or maintenance change.
4. Run formatting, linting, and the production build before opening a pull request.
5. Open a pull request for review; do not push directly to protected `main`.
6. Resolve review feedback with follow-up commits or a team-approved rebase.
7. Merge using the repository's configured strategy, then delete the branch.

Before opening a pull request:

```bash
npm run lint
npm run build
git diff --check
git status
```

### Accessibility and quality

- Use headings, landmarks, labels, and buttons semantically.
- Provide visible focus indicators and sufficient color contrast.
- Add `alt` text to meaningful images and empty `alt` text to decorative images.
- Test important flows with keyboard navigation and at least one screen reader.
- Add unit or component tests for state transitions and critical user flows.
- Review the production build for console errors, failed network requests, and unnecessary bundle growth.

## 5. Daily Development Checklist

```text
[ ] Pull the latest main branch
[ ] Create or switch to a focused branch
[ ] Run npm install when package files change
[ ] Implement the smallest maintainable change
[ ] Check loading, empty, error, mobile, and keyboard states
[ ] Run npm run lint
[ ] Run npm run build
[ ] Review git diff and git diff --check
[ ] Open a pull request with a clear summary and test evidence
```
