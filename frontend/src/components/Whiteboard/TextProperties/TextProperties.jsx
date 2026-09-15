import "./TextProperties.css";

function TextProperties({
    selectedItemIndex,
    strokesRef,
    redraw,
    publish,
    setSelectedItemIndex,
}) {
    if (
        selectedItemIndex === null ||
        strokesRef.current[selectedItemIndex]?.type !== "text"
    ) {
        return null;
    }

    return (
        <div className="text-properties">
            <div className="text-property-group">
                <label>Font Size</label>

                <input
                    type="range"
                    min="12"
                    max="64"
                    value={strokesRef.current[selectedItemIndex].width || 24}
                    onChange={(event) => {
                        const newSize = Number(event.target.value);

                        strokesRef.current[selectedItemIndex].width = newSize;
                        redraw();
                    }}
                />
            </div>

            <div className="text-property-group">
                <label>Color</label>

                <input
                    type="color"
                    value={strokesRef.current[selectedItemIndex].color}
                    onChange={(event) => {
                        strokesRef.current[selectedItemIndex].color =
                            event.target.value;

                        redraw();
                    }}
                />
            </div>

            <div className="text-property-actions">
                <button
                    className="delete-text-button"
                    onClick={() => {
                        strokesRef.current.splice(selectedItemIndex, 1);

                        publish({
                            type: "whiteboard-clear",
                        });

                        strokesRef.current.forEach((item) => {
                            publish({
                                type: "whiteboard-item",
                                item,
                            });
                        });

                        setSelectedItemIndex(null);
                        redraw();
                    }}
                >
                    🗑 Delete
                </button>

                <button
                    className="save-text-button"
                    onClick={() => {
                        publish({
                            type: "whiteboard-item",
                            item: strokesRef.current[selectedItemIndex],
                        });

                        setSelectedItemIndex(null);
                    }}
                >
                    Save
                </button>
            </div>
        </div>
    );
}

export default TextProperties;