
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TurndownService from "turndown";
import { marked } from "marked";
import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import "./NoteDetails.css";
import {
    deleteNote,
    getNoteById,
    updateNote,
    getMetaData,
} from "../services/notes/noteService";
import Sidebar from "./SideBar/sidebar";
import type { MetaDataDTO } from "../services/notes/noteService";

const formatDateTime = (iso: string) => {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
};

const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const v = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    return `${v} ${sizes[i]}`;
};

const NoteDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // États existants
    const [title, setTitle] = useState("");
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // États popup
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Metadata
    const [isMetaPanelOpen] = useState(false);
    const [metadata, setMetadata] = useState<MetaDataDTO | null>(null);
    const [isMetaLoading, setIsMetaLoading] = useState(false);
    const [metaError, setMetaError] = useState<string | null>(null);

    // Clé de sidebar
    const [sidebarKey, setSidebarKey] = useState(0);

    // 🆕 Indicateur visuel autosave
    const [saveStatus, setSaveStatus] =
        useState<"saved" | "saving" | "dirty">("saved");

    // 🆕 Debounce + queue
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savingQueueRef = useRef<Promise<void>>(Promise.resolve());
    const lastSavedTitleRef = useRef<string>("");
    const lastSavedContentRef = useRef<string>("");

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

    // Charger metadata
    const fetchMetadata = useCallback(async () => {
        if (!id) return;
        setIsMetaLoading(true);
        setMetaError(null);
        try {
            const md = await getMetaData(Number(id));
            setMetadata(md);
        } catch (e) {
            console.error("Erreur metadata:", e);
            setMetaError("Impossible de récupérer les métadonnées.");
        } finally {
            setIsMetaLoading(false);
        }
    }, [id]);

    // Mise à jour metadata locale
    useEffect(() => {
        if (!editor) return;

        const updateLocalMeta = () => {
            const plain = editor.getText();

            const countWords = (text: string) => {
                const m = text.trim().match(/\S+/g);
                return m ? m.length : 0;
            };

            const countLines = (text: string) => {
                if (!text) return 0;
                return text.split(/\r\n|\r|\n/).length;
            };

            const byteSize = new Blob([editor.getHTML()]).size;

            setMetadata((prev) =>
                prev
                    ? {
                        ...prev,
                        characterCount: plain.length,
                        wordCount: countWords(plain),
                        lineCount: countLines(plain),
                        byteSize,
                    }
                    : prev
            );
        };

        editor.on("update", updateLocalMeta);
        updateLocalMeta();

        return () => {
            editor.off("update", updateLocalMeta);
        };
    }, [editor]);

    // Sync lecture/édition
    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!isReadOnly);
    }, [editor, isReadOnly]);

    // Charger la note
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

                fetchMetadata();
            } catch (err) {
                console.error("Erreur chargement:", err);
                navigate("/home");
            } finally {
                setIsMetaLoading(false);
            }
        };

        loadData();
    }, [id, editor, navigate]);

    // Détection contenu vide
    const isEditorContentEmpty = () => {
        if (!editor) return true;
        return editor.getText().trim().length === 0;
    };

    // 🆕 Sauvegarde automatique
    const saveNow = async () => {
        if (!editor || !id) return;

        const html = editor.getHTML();
        const turndownService = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
        });
        const markdown = turndownService.turndown(html);

        // Rien n’a changé → on ignore
        const titleChanged = title !== lastSavedTitleRef.current;
        const contentChanged = markdown !== lastSavedContentRef.current;
        if (!titleChanged && !contentChanged) {
            return;
        }

        // Contenu vide → ne pas sauvegarder
        if (isEditorContentEmpty()) {
            setSaveStatus("dirty");
            return;
        }

        setSaveStatus("saving");

        savingQueueRef.current = savingQueueRef.current
            .catch(() => {})
            .then(async () => {
                try {
                    await updateNote(Number(id), { name: title, content: markdown });

                    lastSavedTitleRef.current = title;
                    lastSavedContentRef.current = markdown;

                    setSaveStatus("saved");

                    setSidebarKey((prev) => prev + 1);

                    if (isMetaPanelOpen) {
                        fetchMetadata();
                    }
                } catch (err) {
                    console.error(err);
                    setSaveStatus("dirty");
                }
            });

        await savingQueueRef.current;
    };

    // 🆕 Debounce autosave
    const scheduleAutosave = (delay = 600) => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
        }
        autosaveTimeoutRef.current = setTimeout(() => {
            saveNow();
        }, delay);
    };

    // Sauvegarder à la fermeture de la page
    useEffect(() => {
        const handler = () => saveNow();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [editor, title]);

    // Sauvegarder si le titre change
    useEffect(() => {
        if (!editor) return;
        setSaveStatus("dirty");
        scheduleAutosave();
    }, [title]);

    // Supprimer note
    const handleDelete = async () => {
        try {
            await deleteNote(Number(id));
            navigate("/home");
        } catch {
            setErrorMessage("Erreur lors de la suppression de la note !");
            setShowErrorPopup(true);
        }
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
                                title="Gras"
                            >
                                B
                            </button>

                            <button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`tool-btn ${editor.isActive("italic") ? "active" : ""}`}
                                title="Italique"
                            >
                                I
                            </button>

                            <button
                                onClick={() => {
                                    const previousUrl = editor.getAttributes("link").href;
                                    const url = window.prompt("URL du lien :", previousUrl);
                                    if (url === null) return;
                                    if (url === "") {
                                        editor.chain().focus().extendMarkRange("link").unsetLink().run();
                                    } else {
                                        editor
                                            .chain()
                                            .focus()
                                            .extendMarkRange("link")
                                            .setLink({ href: url })
                                            .run();
                                    }
                                }}
                                className={`tool-btn ${editor.isActive("link") ? "active" : ""}`}
                                title="Lien"
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

                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="tool-btn info-btn"
                                title="Guide Markdown"
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

                                {/* 🆕 INDICATEUR VISUEL */}
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
                            </>
                        )}

                        <button onClick={handleDelete} className="grim-btn delete-btn">
                            ❌ Supprimer
                        </button>
                    </div>
                </div>

                <div
                    className="grim-paper"
                    onClick={() => !isReadOnly && editor.chain().focus().run()}
                >
                    <EditorContent editor={editor} />
                </div>
            </div>

            {showErrorPopup && (
                <div className="grim-error-popup">
                    <div className="popup-icon">⚠️</div>
                    <div className="popup-text">{errorMessage}</div>
                </div>
            )}

            <div className="meta-footer">
                {isMetaLoading && <span>⏳ Chargement des métadonnées…</span>}

                {metaError && <span className="meta-error">⚠️ {metaError}</span>}

                {!isMetaLoading && !metaError && metadata && (
                    <div className="meta-info-row">
                        <span><strong>ID :</strong> {metadata.id}</span>
                        <span><strong>Créée :</strong> {formatDateTime(metadata.createdAt)}</span>
                        <span><strong>Modifiée :</strong> {formatDateTime(metadata.updatedAt)}</span>
                        <span><strong>Taille :</strong> {formatBytes(metadata.byteSize)}</span>
                        <span><strong>Caractères :</strong> {metadata.characterCount.toLocaleString()}</span>
                        <span><strong>Mots :</strong> {metadata.wordCount.toLocaleString()}</span>
                        <span><strong>Lignes :</strong> {metadata.lineCount.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteDetails;
