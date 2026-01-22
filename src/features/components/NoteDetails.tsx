
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TurndownService from "turndown";
import { marked } from "marked";
import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import "./NoteDetails.css";
import { getNoteById, updateNote } from "../services/notes/noteService";
import Sidebar from "./SideBar/sidebar";

const NoteDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [sidebarKey, setSidebarKey] = useState(0);

    // 🆕 Indicateur visuel (rond vert / jaune / rouge)
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty">("saved");

    // 🆕 Debounce + file d'attente
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savingQueueRef = useRef<Promise<void>>(Promise.resolve());

    const lastSavedContentRef = useRef<string>("");
    const lastSavedTitleRef = useRef<string>("");

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false, autolink: true }),
        ],
        content: "",
        editable: true,
        editorProps: {
            attributes: { class: "tiptap-content" },
            handleDOMEvents: {
                blur: () => {
                    scheduleAutosave(0);
                    return false;
                },
            },
        },
        onUpdate: () => {
            setSaveStatus("dirty");
            scheduleAutosave();
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!isReadOnly);
    }, [editor, isReadOnly]);

    useEffect(() => {
        if (!id || !editor) return;

        const loadData = async () => {
            try {
                const note = await getNoteById(Number(id));
                setTitle(note.name);
                lastSavedTitleRef.current = note.name;

                const htmlContent = note.content ? marked.parse(note.content) : "";
                setTimeout(() => {
                    if (editor && !editor.isDestroyed) {
                        editor.commands.setContent(htmlContent);
                        lastSavedContentRef.current = note.content ?? "";
                    }
                }, 0);
            } catch (error) {
                console.error("Erreur chargement:", error);
                navigate("/home");
            }
        };

        loadData();
    }, [id, editor, navigate]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL du lien magique :", previousUrl);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    const isEditorContentEmpty = () => {
        if (!editor) return true;
        const plainText = editor.getText().trim();
        return plainText.length === 0;
    };

    const saveNow = async ({ showPopups = false }: { showPopups?: boolean } = {}) => {
        if (!editor || !id) return;

        setSaveStatus("saving");

        const html = editor.getHTML();
        const turndownService = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
        });
        const markdown = turndownService.turndown(html);

        const titleChanged = title !== lastSavedTitleRef.current;
        const contentChanged = markdown !== lastSavedContentRef.current;

        if (!titleChanged && !contentChanged) {
            setSaveStatus("saved");
            return;
        }

        if (!showPopups && isEditorContentEmpty()) {
            return;
        }

        setIsSaving(true);

        savingQueueRef.current = savingQueueRef.current
            .catch(() => {})
            .then(async () => {
                try {
                    await updateNote(Number(id), { name: title, content: markdown });

                    lastSavedTitleRef.current = title;
                    lastSavedContentRef.current = markdown;

                    setSaveStatus("saved");

                    if (showPopups) {
                        setShowSavePopup(true);
                        setTimeout(() => setShowSavePopup(false), 2000);
                    }

                    setSidebarKey(prev => prev + 1);
                } catch (error) {
                    console.error(error);
                    setSaveStatus("dirty");

                    if (showPopups) {
                        setErrorMessage("Une erreur est survenue lors de l'enregistrement.");
                        setShowErrorPopup(true);
                        setTimeout(() => setShowErrorPopup(false), 2500);
                    }
                } finally {
                    setIsSaving(false);
                }
            });

        await savingQueueRef.current;
    };

    const scheduleAutosave = (delay = 600) => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
            autosaveTimeoutRef.current = null;
        }

        autosaveTimeoutRef.current = setTimeout(() => {
            saveNow({ showPopups: false });
            autosaveTimeoutRef.current = null;
        }, delay);
    };

    useEffect(() => {
        const handler = () => {
            saveNow({ showPopups: false });
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [editor, title]);

    useEffect(() => {
        if (!editor) return;
        setSaveStatus("dirty");
        scheduleAutosave();
    }, [title]);

    const handleManualSave = async () => {
        await saveNow({ showPopups: true });
    };

    if (!editor) return null;

    return (
        <div className="grim-layout">
            <div className="grim-sidebar-wrapper">
                <Sidebar key={sidebarKey} />
            </div>

            <div className={`grim-container ${isReadOnly ? "read-mode" : "edit-mode"}`}>
                <div className="grim-header">
                    <div className="grim-title-container">
                        {isReadOnly ? (
                            <h1 className="grim-title-display">{title}</h1>
                        ) : (
                            <input
                                type="text"
                                className="grim-title-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Titre du Sortilège..."
                            />
                        )}
                    </div>

                    {!isReadOnly && (
                        <div className="grim-toolbar">
                            <button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`tool-btn ${editor.isActive("bold") ? "active" : ""}`}
                            >
                                B
                            </button>

                            <button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`tool-btn ${editor.isActive("italic") ? "active" : ""}`}
                            >
                                I
                            </button>

                            <button
                                onClick={setLink}
                                className={`tool-btn ${editor.isActive("link") ? "active" : ""}`}
                            >
                                🔗
                            </button>

                            <button
                                onClick={() =>
                                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                                }
                                className={`tool-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
                            >
                                H1
                            </button>

                            <button
                                onClick={() =>
                                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                                }
                                className={`tool-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
                            >
                                H2
                            </button>

                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="tool-btn info-btn"
                            >
                                ❓
                            </button>
                        </div>
                    )}

                    <div className="grim-actions">
                        {isReadOnly ? (
                            <button onClick={() => setIsReadOnly(false)} className="grim-btn edit-btn">
                                ✏️ Modifier
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsReadOnly(true)}
                                    className="grim-btn view-btn"
                                    title="Mode Lecture"
                                >
                                    👁️
                                </button>

                                {/* 🆕 Indicateur visuel */}
                                <div
                                    className={`save-indicator ${saveStatus}`}
                                    title={
                                        saveStatus === "saved"
                                            ? "Sauvegardé"
                                            : saveStatus === "saving"
                                                ? "Sauvegarde en cours…"
                                                : "Modifications non sauvegardées"
                                    }
                                />

                                <button
                                    onClick={handleManualSave}
                                    className="grim-btn save-btn"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "⏳..." : "💾 Sauvegarder"}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div
                    className="grim-paper"
                    onClick={() => !isReadOnly && editor.chain().focus().run()}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>

            {showInfoModal && (
                <div className="grim-modal-overlay" onClick={() => setShowInfoModal(false)}>
                    <div className="grim-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="grim-modal-title">📖 Grimoire de Syntaxe</h2>

                        <div className="grim-markdown-guide">
                            <div className="guide-item"><span>**Gras**</span> <span>Gras (Ctrl+B)</span></div>
                            <div className="guide-item"><span>*Italique*</span> <span>Italique (Ctrl+I)</span></div>
                            <div className="guide-item"><span># H1</span> <span>Grand Titre</span></div>
                            <div className="guide-item"><span>## H2</span> <span>Sous-titre</span></div>
                            <div className="guide-item"><span>&gt; Citation</span> <span>Bloc de citation</span></div>
                            <div className="guide-item"><span>`Code`</span> <span>Code en ligne</span></div>
                        </div>

                        <button className="grim-btn close-modal-btn" onClick={() => setShowInfoModal(false)}>
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {showSavePopup && (
                <div className="grim-save-popup">
                    <div className="popup-icon">✨</div>
                    <div className="popup-text">Sortilège mis à jour !</div>
                </div>
            )}

            {showErrorPopup && (
                <div className="grim-error-popup">
                    <div className="popup-icon">⚠️</div>
                    <div className="popup-text">{errorMessage || "Erreur inconnue."}</div>
                </div>
            )}
        </div>
    );
};

export default NoteDetails;
