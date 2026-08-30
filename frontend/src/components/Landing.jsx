
import "./Landing.css";

export default function Landing({
    name,
    setName,
    roomId,
    setRoomId,
    handleJoin,
    handleCreate,
    navigate,
}) {
    return (
        <div className="landing-page">

            {/* Background effects */}
            <div className="ambient ambient-one"></div>
            <div className="ambient ambient-two"></div>

            {/* NAVBAR */}
            <nav className="landing-nav">

                <div className="landing-logo">

                    <div className="logo-symbol">
                        ✦
                    </div>

                    <div>
                        <div className="logo-text">
                            Sync<span>Space</span>
                        </div>

                        <div className="logo-caption">
                            THINK · CREATE · TOGETHER
                        </div>
                    </div>

                </div>

                <div className="nav-center">
                    <span>Workspace</span>
                    <span>Features</span>
                    <span>About</span>
                </div>

                <div className="nav-right">

                    <div className="status-small">
                        <i></i>
                        All systems operational
                    </div>

                    <button
                        className="nav-login"
                        type="button"
                        onClick={() => navigate("/login")}
                    >
                        Sign in
                    </button>

                </div>

            </nav>

            {/* HERO */}
            <main className="hero">

                {/* LEFT SIDE */}
                <section className="hero-content">

                    <div className="eyebrow">
                        <span className="eyebrow-dot"></span>

                        COLLABORATIVE DIGITAL WORKSPACE

                        <span className="eyebrow-arrow">
                            ↗
                        </span>
                    </div>

                    <h1>
                        Turn ideas
                        <br />

                        <span className="gradient-text">
                            into something real.
                        </span>
                    </h1>

                    <p className="hero-description">
                        A shared visual workspace for teams
                        to think, sketch, plan and build
                        together — without getting in each
                        other's way.
                    </p>

                    {/* STATS */}
                    <div className="hero-stats">

                        <div>
                            <strong>∞</strong>
                            <span>Canvas</span>
                        </div>

                        <div className="stat-line"></div>

                        <div>
                            <strong>01</strong>
                            <span>Shared space</span>
                        </div>

                        <div className="stat-line"></div>

                        <div>
                            <strong>24/7</strong>
                            <span>Available</span>
                        </div>

                    </div>

                    {/* FEATURES */}
                    <div className="feature-list">

                        <div className="feature-item">

                            <div className="feature-icon">
                                ✦
                            </div>

                            <div>
                                <strong>
                                    One shared canvas
                                </strong>

                                <p>
                                    Bring ideas, sketches and
                                    plans into one visual space.
                                </p>
                            </div>

                        </div>

                        <div className="feature-item">

                            <div className="feature-icon">
                                ↗
                            </div>

                            <div>
                                <strong>
                                    Built for collaboration
                                </strong>

                                <p>
                                    Work together without
                                    switching between tools.
                                </p>
                            </div>

                        </div>

                        <div className="feature-item">

                            <div className="feature-icon">
                                ◌
                            </div>

                            <div>
                                <strong>
                                    Simple by design
                                </strong>

                                <p>
                                    Everything you need.
                                    Nothing getting in the way.
                                </p>
                            </div>

                        </div>

                    </div>

                </section>

                {/* JOIN CARD */}
                <section className="join-section">

                    <div className="join-card">

                        <div className="card-top">

                            <div>

                                <div className="card-kicker">
                                    WORKSPACE ACCESS
                                </div>

                                <h2>
                                    Enter your space
                                </h2>

                                <p>
                                    Join an existing workspace
                                    or start a new one.
                                </p>

                            </div>

                            <div className="card-number">
                                01
                            </div>

                        </div>

                        <div className="form">

                            {/* NAME */}
                            <label>
                                YOUR NAME
                            </label>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    ◯
                                </span>

                                <input
                                    type="text"
                                    placeholder="How should we call you?"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                />

                            </div>

                            {/* ROOM */}
                            <label>
                                ROOM ID
                            </label>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    #
                                </span>

                                <input
                                    type="text"
                                    placeholder="Enter workspace ID"
                                    value={roomId}
                                    onChange={(e) =>
                                        setRoomId(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleJoin();
                                        }
                                    }}
                                />

                            </div>

                            {/* JOIN */}
                            <button
                                className="join-button"
                                type="button"
                                onClick={handleJoin}
                            >
                                <span>
                                    Enter workspace
                                </span>

                                <strong>
                                    →
                                </strong>
                            </button>

                            {/* DIVIDER */}
                            <div className="or-divider">

                                <span></span>

                                <small>
                                    OR
                                </small>

                                <span></span>

                            </div>

                            {/* CREATE */}
                            <button
                                className="create-button"
                                type="button"
                                onClick={handleCreate}
                            >
                                <span className="plus">
                                    +
                                </span>

                                Create a new workspace
                            </button>

                        </div>

                        <div className="card-footer">

                            <span>
                                ●
                            </span>

                            Your workspace is private
                            by default.

                        </div>

                    </div>

                    {/* Floating labels */}
                    <div className="floating-label label-one">

                        <span></span>

                        Live canvas

                    </div>

                    <div className="floating-label label-two">

                        +3 collaborators

                    </div>

                </section>

            </main>

            {/* FOOTER */}
            <footer className="landing-footer">

                <span>
                    SYNCSpace / 2026
                </span>

                <div>
                    <span>Designed for ideas</span>
                    <span>•</span>
                    <span>Built for teams</span>
                </div>

            </footer>

        </div>
    );
}

