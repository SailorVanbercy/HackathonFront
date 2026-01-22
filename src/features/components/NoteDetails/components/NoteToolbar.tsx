import React from "react";
import { Editor } from "@tiptap/react";

interface NoteToolbarProps {
    editor: Editor;
    onOpenLinkModal: () => void;
    onOpenInfoModal: () => void;
}

export const NoteToolbar: React.FC<NoteToolbarProps> = ({
                                                            editor,
                                                            onOpenLinkModal,
                                                            onOpenInfoModal,
                                                        }) => {
    if (!editor) return null;

    return (
        <div className="grim-toolbar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`tool-btn ${editor.isActive("bold") ? "active" : ""}`}
                title="Gras (Ctrl+B)"
            >
                B
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`tool-btn ${editor.isActive("italic") ? "active" : ""}`}
                title="Italique (Ctrl+I)"
            >
                I
            </button>

            <button
                onClick={onOpenLinkModal}
                className={`tool-btn ${editor.isActive("link") ? "active" : ""}`}
                title="Insérer un lien (Ctrl+K)"
            >
                🔗
            </button>

            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`tool-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
            >
                H1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`tool-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
            >
                H2
            </button>
            <button onClick={onOpenInfoModal} className="tool-btn info-btn" title="Aide raccourcis">
                ❓
            </button>
        </div>
    );
};