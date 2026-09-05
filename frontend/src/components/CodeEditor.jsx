import {
    useEffect,
    useState,
} from "react";

import socket from "../socket/socket";

const languageTemplates = {
    JavaScript: `// SyncSpace interview workspace

function summarizeIdea(idea) {

  return idea.trim();

}

const idea = summarizeIdea("Build together");

console.log(idea);`,

    TypeScript: `// SyncSpace interview workspace

type Idea = string;

function summarizeIdea(
  idea: Idea
): Idea {

  return idea.trim();

}

console.log(
  summarizeIdea("Build together")
);`,

    Python: `# SyncSpace interview workspace

def summarize_idea(idea):

    return idea.strip()

idea = summarize_idea(
    "Build together"
)

print(idea)`,

    JSON: `{
  "workspace": "SyncSpace",
  "idea": "Build together",
  "status": "shared"
}`,
};

function CodeEditor({ roomId }) {

    const [code, setCode] = useState(
        languageTemplates.JavaScript
    );

    const [language, setLanguage] =
        useState("JavaScript");

    const [saved, setSaved] =
        useState(false);

    const [lineCount, setLineCount] =
        useState(
            languageTemplates.JavaScript.split(
                "\n"
            ).length
        );

    // ==========================================
    // LINE COUNT
    // ==========================================
    useEffect(() => {
        setLineCount(
            code.split("\n").length
        );
    }, [code]);


    // ==========================================
    // RECEIVE CODE FROM OTHER USERS
    // ==========================================
    useEffect(() => {

        if (!roomId) return;

        const handleCodeChange = ({
            roomId: incomingRoomId,
            code: incomingCode,
        }) => {

            // Ignore code from another room
            if (incomingRoomId !== roomId) {
                return;
            }

            setCode(incomingCode);
            setSaved(false);
        };

        socket.on(
            "code-change",
            handleCodeChange
        );

        return () => {
            socket.off(
                "code-change",
                handleCodeChange
            );
        };

    }, [roomId]);


    // ==========================================
    // LOCAL CODE CHANGE
    // ==========================================
    const updateCode = (event) => {

        const nextCode =
            event.target.value;

        setCode(nextCode);
        setSaved(false);

        socket.emit("code-change", {
            roomId,
            code: nextCode,
        });
    };


    // ==========================================
    // LANGUAGE CHANGE
    // ==========================================
    const changeLanguage = (event) => {

        const nextLanguage =
            event.target.value;

        const savedCode =
            localStorage.getItem(
                `syncspace-code-${nextLanguage}`
            );

        const nextCode =
            savedCode ||
            languageTemplates[nextLanguage];

        setLanguage(nextLanguage);
        setCode(nextCode);
        setSaved(false);

        socket.emit("code-change", {
            roomId,
            code: nextCode,
        });
    };


    // ==========================================
    // SAVE DRAFT
    // ==========================================
    const saveDraft = () => {

        localStorage.setItem(
            `syncspace-code-${language}`,
            code
        );

        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 1800);
    };


    // ==========================================
    // TAB INSERT
    // ==========================================
    const insertTab = (event) => {

        if (event.key !== "Tab") {
            return;
        }

        event.preventDefault();

        const textarea =
            event.currentTarget;

        const start =
            textarea.selectionStart;

        const end =
            textarea.selectionEnd;

        const nextCode =
            code.substring(0, start) +
            "  " +
            code.substring(end);

        setCode(nextCode);
        setSaved(false);

        socket.emit("code-change", {
            roomId,
            code: nextCode,
        });

        requestAnimationFrame(() => {

            textarea.selectionStart =
                start + 2;

            textarea.selectionEnd =
                start + 2;

        });
    };


    return (
        <section
            className="code-editor-panel"
            aria-label="Code editor"
        >

            <header className="code-editor-header">

                <div>

                    <span className="panel-eyebrow">
                        Shared workspace
                    </span>

                    <h2>
                        Interview Editor
                    </h2>

                </div>

                <div className="editor-actions">

                    <select
                        aria-label="Programming language"
                        value={language}
                        onChange={
                            changeLanguage
                        }
                    >

                        <option>
                            JavaScript
                        </option>

                        <option>
                            TypeScript
                        </option>

                        <option>
                            Python
                        </option>

                        <option>
                            JSON
                        </option>

                    </select>

                    <button
                        type="button"
                        className="editor-save"
                        onClick={
                            saveDraft
                        }
                    >

                        {saved
                            ? "✓ Saved"
                            : "Save"}

                    </button>

                </div>

            </header>


            <div className="editor-statusbar">

                <span className="editor-status-dot" />

                <span>
                    Shared across room
                </span>

                <span className="editor-language">
                    {language}
                </span>

            </div>


            <div className="editor-surface">

                <div
                    className="line-numbers"
                    aria-hidden="true"
                >

                    {Array.from(
                        {
                            length:
                                lineCount,
                        },
                        (_, index) => (

                            <span
                                key={index}
                            >

                                {index + 1}

                            </span>

                        )
                    )}

                </div>


                <textarea
                    value={code}
                    onChange={
                        updateCode
                    }
                    onKeyDown={
                        insertTab
                    }
                    spellCheck="false"
                    autoCapitalize="off"
                    autoCorrect="off"
                    aria-label="Code"
                />

            </div>

        </section>
    );
}

export default CodeEditor;