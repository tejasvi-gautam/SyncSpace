import "./RemoteCursors.css";

function RemoteCursors({ remoteCursors, toScreenPoint }) {
    return (
        <>
            {Object.values(remoteCursors).map((cursor) => {
                const remotePosition = toScreenPoint(cursor);

                return (
                    <div
                        key={cursor.userId}
                        className="remote-cursor"
                        style={{
                            left: remotePosition.x,
                            top: remotePosition.y,
                            "--cursor-color": cursor.color,
                        }}
                    >
                        <div className="cursor-pointer">
                            ◆
                        </div>

                        <div className="cursor-label">
                            {cursor.userName}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

export default RemoteCursors;