import { useEffect, useRef, useState } from "react";

const languageTemplates = {
    JavaScript: `// SyncSpace workspace\nfunction summarizeIdea(idea) {\n  return idea.trim();\n}\n\nconst idea = summarizeIdea("Build together");\nconsole.log(idea);`,
    TypeScript: `// SyncSpace workspace\ntype Idea = string;\n\nfunction summarizeIdea(idea: Idea): Idea {\n  return idea.trim();\n}\n\nconsole.log(summarizeIdea("Build together"));`,
    Python: `# SyncSpace workspace\ndef summarize_idea(idea):\n    return idea.strip()\n\nidea = summarize_idea("Build together")\nprint(idea)`,
    JSON: `{\n  "workspace": "SyncSpace",\n  "idea": "Build together",\n  "status": "shared"\n}`
};

function CodeEditor({ roomId }) {
    const [code, setCode] = useState(languageTemplates.JavaScript);
    const [language, setLanguage] = useState("JavaScript");
    const [saved, setSaved] = useState(false);
    const channelRef = useRef(null);
    const codeRef = useRef(code);
    const languageRef = useRef(language);

    useEffect(() => {
        if (!roomId || typeof BroadcastChannel === "undefined") return undefined;

        const channel = new BroadcastChannel(`syncspace-room-${roomId}`);
        channelRef.current = channel;
        channel.onmessage = (event) => {
            if (event.data.type === "code-sync-request") {
                channel.postMessage({
                    type: "code-sync",
                    code: codeRef.current,
                    language: languageRef.current
                });
                return;
            }

            if (event.data.type !== "code-sync") return;
            setLanguage(event.data.language);
            setCode(event.data.code);
            codeRef.current = event.data.code;
            languageRef.current = event.data.language;
        };
        channel.postMessage({ type: "code-sync-request" });

        return () => {
            channel.close();
            channelRef.current = null;
        };
    }, [roomId]);

    const publishCode = (nextCode, nextLanguage = language) => {
        channelRef.current?.postMessage({
            type: "code-sync",
            code: nextCode,
            language: nextLanguage
        });
    };

    const updateCode = (event) => {
        setCode(event.target.value);
        codeRef.current = event.target.value;
        setSaved(false);
        publishCode(event.target.value);
    };

    const changeLanguage = (event) => {
        const nextLanguage = event.target.value;
        const savedCode = localStorage.getItem(`syncspace-code-${nextLanguage}`);
        const nextCode = savedCode || languageTemplates[nextLanguage];
        setLanguage(nextLanguage);
        setCode(nextCode);
        codeRef.current = nextCode;
        languageRef.current = nextLanguage;
        setSaved(false);
        publishCode(nextCode, nextLanguage);
    };

    const saveDraft = () => {
        localStorage.setItem(`syncspace-code-${language}`, code);
        setSaved(true);
    };

    return (
        <section className="code-editor-panel" aria-label="Code editor">
            <header className="code-editor-header">
                <div>
                    <span className="panel-eyebrow">Shared workspace</span>
                    <h2>Code editor</h2>
                </div>
                <div className="editor-actions">
                    <select
                        aria-label="Programming language"
                        value={language}
                        onChange={changeLanguage}
                    >
                        <option>JavaScript</option>
                        <option>TypeScript</option>
                        <option>Python</option>
                        <option>JSON</option>
                    </select>
                    <button type="button" className="editor-save" onClick={saveDraft}>
                        {saved ? "Saved" : "Save draft"}
                    </button>
                </div>
            </header>

            <div className="editor-statusbar">
                <span className="editor-status-dot" />
                Shared across room tabs
                <span className="editor-language">{language}</span>
            </div>

            <div className="editor-surface">
                <div className="line-numbers" aria-hidden="true">
                    {code.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}
                </div>
                <textarea
                    value={code}
                    onChange={updateCode}
                    spellCheck="false"
                    aria-label="Code"
                />
            </div>
        </section>
    );
}

export default CodeEditor;
