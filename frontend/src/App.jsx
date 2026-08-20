import { useState } from "react";
import "./App.css";
import Whiteboard from "./components/Whiteboard";
import CodeEditor from "./components/CodeEditor";

function App() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  const joinRoom = () => {
    if (!name || !roomId) {
      alert("Please enter your name and Room ID");
      return;
    }

    setJoined(true);
  };

  const createRoom = () => {
    const newRoomId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    setRoomId(newRoomId);

    if (!name) {
      alert("Please enter your name first");
      return;
    }

    setJoined(true);
  };

  // WHITEBOARD PAGE
  if (joined) {
    return (
      <div className="whiteboard-app">

        {/* Top Navbar */}
        <header className="whiteboard-navbar">

          <div className="whiteboard-logo">
            ✦ <span>SyncSpace</span>
          </div>

          <div className="room-info">
            <span className="live-dot"></span>
            Room: <strong>{roomId}</strong>
          </div>

          <div className="user-section">
            <div className="user-avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <span>{name}</span>

            <button
              className="leave-button"
              onClick={() => setJoined(false)}
            >
              Leave
            </button>
          </div>

        </header>

        <div className="workspace-shell">

          <main className="workspace-pane canvas-pane">
            <div className="pane-heading">
              <div>
                <span className="panel-eyebrow">Room canvas</span>
                <h2>Whiteboard</h2>
              </div>
              <span className="pane-hint">Draw or switch to Text</span>
            </div>
            <Whiteboard roomId={roomId} />
          </main>

          <main className="workspace-pane editor-pane">
            <CodeEditor roomId={roomId} />
          </main>

          <aside className="collaboration-panel">

            <h3>Collaborators</h3>

            <div className="collaborator">

              <div className="collaborator-avatar">
                {name.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{name}</strong>
                <p>Online</p>
              </div>

              <span className="online-dot"></span>

            </div>

            <div className="panel-divider"></div>

            <h3>Room Details</h3>

            <div className="room-card">

              <span>Room ID</span>

              <strong>{roomId}</strong>

            </div>

            <button
              className="share-button"
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                alert("Room ID copied!");
              }}
            >
              🔗 Copy Room ID
            </button>

          </aside>

        </div>

      </div>
    );
  }

  // JOIN PAGE
  return (
    <div className="app">

      <div className="circle circle1"></div>
      <div className="circle circle2"></div>

      <nav className="navbar">

        <div className="logo">
          <div className="logo-icon">✦</div>
          <span>SyncSpace</span>
        </div>

        <div className="nav-right">
          <span className="status-dot"></span>
          <span>Real-time collaboration</span>
        </div>

      </nav>

      <main className="main-container">

        <section className="hero-section">

          <div className="badge">
            ✨ CREATE • COLLABORATE • INNOVATE
          </div>

          <h1>
            Ideas happen better
            <span> together.</span>
          </h1>

          <p>
            A real-time collaborative whiteboard where teams can
            brainstorm, create and bring ideas to life.
          </p>

          <div className="features">

            <div className="feature">
              <div className="feature-icon">⚡</div>
              <div>
                <h3>Real-Time Sync</h3>
                <p>Collaborate instantly with your team.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">🎨</div>
              <div>
                <h3>Creative Canvas</h3>
                <p>Draw, write and visualize your ideas.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">👥</div>
              <div>
                <h3>Team Collaboration</h3>
                <p>Work together from anywhere.</p>
              </div>
            </div>

          </div>

        </section>

        <section className="join-card">

          <div className="card-header">
            <h2>Join a Workspace</h2>
            <p>Enter your details to start collaborating</p>
          </div>

          <div className="form-group">

            <label>Your Name</label>

            <div className="input-box">
              <span>👤</span>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

            </div>

          </div>

          <div className="form-group">

            <label>Room ID</label>

            <div className="input-box">
              <span>🔗</span>

              <input
                type="text"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />

            </div>

          </div>

          <button
            className="join-button"
            onClick={joinRoom}
          >
            Join Workspace →
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            className="create-button"
            onClick={createRoom}
          >
            + Create New Room
          </button>

          <p className="secure-text">
            🔒 Secure and private collaboration
          </p>

        </section>

      </main>

      <footer>
        © 2026 SyncSpace • Built for better collaboration
      </footer>

    </div>
  );
}

export default App;