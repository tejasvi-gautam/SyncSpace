import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

const languageConfig = {
    JavaScript: {
        monacoLanguage: "javascript",
        template: `// SyncSpace interview workspace

function solveProblem(input) {
    return input.trim();
}

const result = solveProblem("Build together");

console.log(result);`,
    },

    TypeScript: {
        monacoLanguage: "typescript",
        template: `// SyncSpace interview workspace

type Input = string;

function solveProblem(input: Input): Input {
    return input.trim();
}

console.log(solveProblem("Build together"));`,
    },

    Python: {
        monacoLanguage: "python",
        template: `# SyncSpace interview workspace

def solve_problem(input_text):
    return input_text.strip()

result = solve_problem("Build together")

print(result)`,
    },

    JSON: {
        monacoLanguage: "json",
        template: `{
  "project": "SyncSpace",
  "workspace": "Interview",
  "status": "shared"
}`,
    },
};

function CodeEditor({
    roomId,
    code,
    setCode,
    language,
    setLanguage,
    codeSaved,
    setCodeSaved,
    codePanelWidth,
    codeResizeRef,
    setIsCodeOpen,
    socket,
}) {
    const [editorInstance, setEditorInstance] =
        useState(null);

    // =====================================================
    // UPDATE CODE
    // =====================================================

    const updateCode = (value) => {
        const nextCode = value ?? "";

        setCode(nextCode);
        setCodeSaved(false);

        if (
            socket &&
            socket.connected &&
            roomId
        ) {
            socket.emit("code-change", {
                roomId,
                code: nextCode,
            });
        }
    };

    // =====================================================
    // CHANGE LANGUAGE
    // =====================================================

    const changeLanguage = (event) => {
        const nextLanguage =
            event.target.value;

        const savedCode =
            localStorage.getItem(
                `syncspace-code-${nextLanguage}`
            );

        const nextCode =
            savedCode ??
            languageConfig[nextLanguage]
                ?.template ??
            "";

        setLanguage(nextLanguage);
        setCode(nextCode);
        setCodeSaved(false);

        if (
            socket &&
            socket.connected &&
            roomId
        ) {
            socket.emit("code-change", {
                roomId,
                code: nextCode,
            });
        }
    };

    // =====================================================
    // SAVE
    // =====================================================

    const saveCode = () => {
        localStorage.setItem(
            `syncspace-code-${language}`,
            code
        );

        setCodeSaved(true);
    };

    // =====================================================
    // MONACO MOUNT
    // =====================================================

    const handleEditorMount = (
        editor
    ) => {
        setEditorInstance(editor);

        editor.focus();
    };

    // =====================================================
    // LANGUAGE UPDATE
    // =====================================================

    useEffect(() => {
        if (!editorInstance) {
            return;
        }

        const config =
            languageConfig[language];

        if (!config) {
            return;
        }

        const model =
            editorInstance.getModel();

        if (model) {
            window.monaco?.editor
                ?.setModelLanguage(
                    model,
                    config.monacoLanguage
                );
        }
    }, [
        language,
        editorInstance,
    ]);

    // =====================================================
    // UI
    // =====================================================

    return (
        <section
            className="floating-code-editor"
            style={{
                width: `${codePanelWidth}px`,
            }}
            aria-label="Code editor"
        >
            {/* RESIZE HANDLE */}

            <button
                type="button"
                className="code-resize-handle"
                onPointerDown={() => {
                    codeResizeRef.current =
                        true;

                    document.body.style.cursor =
                        "col-resize";
                }}
                title="Drag to resize code panel"
                aria-label="Resize code panel"
            >
                <span>⟷</span>
            </button>

            {/* HEADER */}

            <div className="floating-code-header">
                <div>
                    <span>
                        CODE
                    </span>

                    <strong>
                        Interview Editor
                    </strong>
                </div>

                <div className="code-actions">
                    <button
                        type="button"
                        className="code-close"
                        onClick={() =>
                            setIsCodeOpen(
                                false
                            )
                        }
                        title="Close code editor"
                        aria-label="Close code editor"
                    >
                        ×
                    </button>

                    <select
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
                        onClick={saveCode}
                    >
                        {codeSaved
                            ? "✓ Saved"
                            : "Save"}
                    </button>
                </div>
            </div>

            {/* STATUS */}

            <div className="code-status">
                <span />

                Shared coding panel

                <b>
                    {language}
                </b>
            </div>

            {/* MONACO */}

            <div className="code-body">
                <Editor
                    height="100%"
                    width="100%"
                    language={
                        languageConfig[
                            language
                        ]?.monacoLanguage ??
                        "javascript"
                    }
                    theme="vs-dark"
                    value={code}
                    onChange={updateCode}
                    onMount={
                        handleEditorMount
                    }
                    options={{
                        automaticLayout: true,

                        minimap: {
                            enabled: true,
                        },

                        fontSize: 14,

                        lineNumbers: "on",

                        wordWrap: "on",

                        tabSize: 4,

                        insertSpaces: true,

                        folding: true,

                        bracketPairColorization: {
                            enabled: true,
                        },

                        suggestOnTriggerCharacters:
                            true,

                        quickSuggestions: true,

                        smoothScrolling: true,

                        cursorBlinking:
                            "smooth",

                        padding: {
                            top: 10,
                            bottom: 10,
                        },

                        scrollBeyondLastLine:
                            false,
                    }}
                />
            </div>
        </section>
    );
}

export default CodeEditor;