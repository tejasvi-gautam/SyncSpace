import "./ShapeMenu.css";

function ShapeMenu({
    shapeMenuOpen,
    setTool,
    setShapeMenuOpen,
}) {
    if (!shapeMenuOpen) {
        return null;
    }

    return (
        <div className="shape-menu">
            <button
                onClick={() => {
                    setTool("rectangle");
                    setShapeMenuOpen(false);
                }}
            >
                ▭ Rectangle
            </button>

            <button
                onClick={() => {
                    setTool("circle");
                    setShapeMenuOpen(false);
                }}
            >
                ● Circle
            </button>

            <button
                onClick={() => {
                    setTool("triangle");
                    setShapeMenuOpen(false);
                }}
            >
                △ Triangle
            </button>

            <button
                onClick={() => {
                    setTool("diamond");
                    setShapeMenuOpen(false);
                }}
            >
                ◇ Diamond
            </button>
        </div>
    );
}

export default ShapeMenu;