import "./Toolbar.css";
import ShapeMenu from "../ShapeMenu/ShapeMenu";

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

                <ShapeMenu
                  shapeMenuOpen={shapeMenuOpen}
                  setTool={setTool}
                  setShapeMenuOpen={setShapeMenuOpen}
                />
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