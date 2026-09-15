import "./Toolbar.css";

function Toolbar({
    tool,
    setTool,
    color,
    setColor,
    lineWidth,
    setLineWidth,
    textSize,
    setTextSize,
    setSelectedItemIndex,
    shapeMenuOpen,
    setShapeMenuOpen,
    undo,
    redo,
    fitToScreen,
    clearBoard,
}) {
    return (
        <div className="toolbar">

            <label>
                Color:

                <input
                    type="color"
                    value={color}
                    onChange={(event) =>
                        setColor(event.target.value)
                    }
                />
            </label>

            <label>
                Brush:

                <input
                    type="range"
                    min="1"
                    max="30"
                    value={lineWidth}
                    onChange={(event) =>
                        setLineWidth(
                            Number(event.target.value)
                        )
                    }
                />
            </label>

            <label>
                Text:

                <input
                    type="range"
                    min="12"
                    max="64"
                    value={textSize}
                    onChange={(event) =>
                        setTextSize(
                            Number(event.target.value)
                        )
                    }
                />
            </label>

            {/* SELECT */}

            <button
                className={
                    tool === "select"
                        ? "active-tool"
                        : ""
                }
                onClick={() => {
                    setTool("select");
                    setSelectedItemIndex(null);
                }}
                title="Select to edit text"
            >
                ➤ Select
            </button>

            {/* DRAW */}

            <button
                className={
                    tool === "draw"
                        ? "active-tool"
                        : ""
                }
                onClick={() => setTool("draw")}
            >
                🖊 Draw
            </button>

            {/* RECTANGLE */}

            <button
                className={
                    tool === "rectangle"
                        ? "active-tool"
                        : ""
                }
                onClick={() => setTool("rectangle")}
            >
                ▭ Rectangle
            </button>

            {/* ERASER */}

            <button
                className={
                    tool === "eraser"
                        ? "active-tool"
                        : ""
                }
                onClick={() => setTool("eraser")}
            >
                🧹 Eraser
            </button>

            {/* TEXT */}

            <button
                className={
                    tool === "text"
                        ? "active-tool"
                        : ""
                }
                onClick={() => setTool("text")}
            >
                T Text
            </button>

            {/* LINE */}

            <button
                className={
                    tool === "line"
                        ? "active-tool"
                        : ""
                }
                onClick={() => setTool("line")}
            >
                ➖ Line
            </button>

            {/* ARROW */}

            <button
                className={
                    tool === "arrow"
                        ? "active-tool"
                        : ""
                }
                onClick={() => setTool("arrow")}
            >
                ➡️ Arrow
            </button>

            {/* SHAPES MENU */}

            <div style={{ position: "relative" }}>

                <button
                    className={
                        [
                            "rectangle",
                            "circle",
                            "triangle",
                            "diamond",
                        ].includes(tool)
                            ? "active-tool"
                            : ""
                    }
                    onClick={() =>
                        setShapeMenuOpen(!shapeMenuOpen)
                    }
                >
                    🔷 Shapes
                </button>

                {shapeMenuOpen && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            background: "white",
                            border: "1px solid #dbe1ea",
                            borderRadius: "8px",
                            zIndex: 100,
                            minWidth: "120px",
                        }}
                    >
                        <button
                            onClick={() => {
                                setTool("rectangle");
                                setShapeMenuOpen(false);
                            }}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "8px 12px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            ▭ Rectangle
                        </button>

                        <button
                            onClick={() => {
                                setTool("circle");
                                setShapeMenuOpen(false);
                            }}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "8px 12px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            ● Circle
                        </button>

                        <button
                            onClick={() => {
                                setTool("triangle");
                                setShapeMenuOpen(false);
                            }}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "8px 12px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            △ Triangle
                        </button>

                        <button
                            onClick={() => {
                                setTool("diamond");
                                setShapeMenuOpen(false);
                            }}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "8px 12px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            ◇ Diamond
                        </button>
                    </div>
                )}
            </div>

            {/* PAN */}

            <button
                className={
                    tool === "pan"
                        ? "active-tool"
                        : ""
                }
                onClick={() => setTool("pan")}
                title="Hold spacebar to pan"
            >
                ✋ Pan
            </button>

            {/* UNDO / REDO */}

            <button
                onClick={undo}
                title="Undo (Ctrl+Z)"
            >
                ↶ Undo
            </button>

            <button
                onClick={redo}
                title="Redo (Ctrl+Y)"
            >
                ↷ Redo
            </button>

            {/* FIT TO SCREEN */}

            <button
                onClick={fitToScreen}
                title="Fit all content to screen"
            >
                ⛶ Fit
            </button>

            {/* CLEAR */}

            <button onClick={clearBoard}>
                🗑 Clear
            </button>

        </div>
    );
}

export default Toolbar;