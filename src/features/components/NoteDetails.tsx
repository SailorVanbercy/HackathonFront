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
import {useHotkeys} from "react-hotkeys-hook";

const formatDateTime = (iso: string) => {
    try {
        return new Date(iso).toLocaleString(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
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

    // Popup d'erreur personnalisée
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Metadata
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
    // CORRECTION : Ajout du mode "silent" pour ne pas faire clignoter le loader en autosave
    const fetchMetadata = useCallback(async (isSilent = false) => {
        if (!id) return;
        if (!isSilent) setIsMetaLoading(true);
        setMetaError(null);
        try {
            const md = await getMetaData(Number(id));
            setMetadata(md);
        } catch (e) {
            console.error("Erreur metadata:", e);
            setMetaError("Impossible de récupérer les métadonnées.");
        } finally {
            if (!isSilent) setIsMetaLoading(false);
        }
    }, [id]);

    // Mise à jour metadata locale (calculs temps réel pour les stats, pas la date)
    useEffect(() => {
        if (!editor) return;

        const updateLocalMeta = () => {
            const plain = editor.getText();
            const countWords = (text: string) => (text.trim().match(/\S+/g) || []).length;
            const countLines = (text: string) => text ? text.split(/\r\n|\r|\n/).length : 0;
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
        return () => { editor.off("update", updateLocalMeta); };
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

                fetchMetadata(); // Chargement initial (avec loader)
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
        const turndownService = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
        const markdown = turndownService.turndown(html);

        const titleChanged = title !== lastSavedTitleRef.current;
        const contentChanged = markdown !== lastSavedContentRef.current;

        if (!titleChanged && !contentChanged) {
            setSaveStatus("saved");
            return;
        }

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

                    // CORRECTION MAJEURE : On appelle fetchMetadata ICI, à l'intérieur de la file d'attente.
                    // Cela garantit que l'update est FINI côté serveur avant de demander la date.
                    // On passe 'true' pour le mode silencieux (pas de loader visuel).
                    await fetchMetadata(true);

                } catch (err) {
                    console.error("Erreur save:", err);
                    setSaveStatus("dirty");
                }
            });

        // On attend simplement que la file se vide.
        // On NE FAIT PLUS "await fetchMetadata()" ici pour éviter le conflit.
        await savingQueueRef.current;
        await fetchMetadata();
    };

    const scheduleAutosave = (delay = 600) => {
        if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = setTimeout(() => saveNow(), delay);
    };

    useEffect(() => {
        const handler = () => saveNow();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [editor, title]);

    useEffect(() => {
        if (!editor) return;
        setSaveStatus("dirty");
        scheduleAutosave();
    }, [title]);

    const handleDelete = async () => {
        try {
            await deleteNote(Number(id));
            navigate("/home");
        } catch {
            setErrorMessage("Erreur lors de la suppression de la note !");
            setShowErrorPopup(true);
        }
    };

    useHotkeys('alt+v', (e) => { e.preventDefault(); setIsReadOnly(!isReadOnly); }, { enableOnFormTags: true, enableOnContentEditable: true, preventDefault: true });
    useHotkeys('alt+i', (e) => { e.preventDefault(); setShowInfoModal(!showInfoModal); }, { enableOnFormTags: true, enableOnContentEditable: true, preventDefault: true });
    useHotkeys('ctrl +enter', (e) => { e.preventDefault(); navigate("/home"); }, { enableOnFormTags: true, enableOnContentEditable: true, preventDefault: true });

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
                            <input type="text" className="grim-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du Sortilège..." />
                        )}
                    </div>

                    {!isReadOnly && (
                        <div className="grim-toolbar">
                            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`tool-btn ${editor.isActive("bold") ? "active" : ""}`}>B</button>
                            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`tool-btn ${editor.isActive("italic") ? "active" : ""}`}>I</button>
                            <button onClick={() => {
                                const previousUrl = editor.getAttributes("link").href;
                                const url = window.prompt("URL du lien :", previousUrl);
                                if (url === null) return;
                                if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
                                else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
                            }} className={`tool-btn ${editor.isActive("link") ? "active" : ""}`}>🔗</button>
                            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`tool-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}>H1</button>
                            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`tool-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}>H2</button>
                            <button onClick={() => setShowInfoModal(true)} className="tool-btn info-btn">❓</button>
                        </div>
                    )}

                    <div className="grim-actions">
                        {isReadOnly ? (
                            <button onClick={() => setIsReadOnly(false)} className="grim-btn edit-btn">✏️ Modifier</button>
                        ) : (
                            <>
                                <button onClick={() => setIsReadOnly(true)} className="grim-btn view-btn">👁️</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grim-paper" onClick={() => !isReadOnly && editor.chain().focus().run()}>
                    <EditorContent editor={editor} />
                </div>

                {/* --- NOUVEAU STYLE : BARRE FLOTTANTE COMPACTE --- */}
                {!isMetaLoading && !metaError && metadata && (
                    <div className="grim-meta-bar">
                        <span title="Dernière modification">🕒 {formatDateTime(metadata.updatedAt)}</span>
                        <span className="meta-sep">•</span>
                        <span>📦 {formatBytes(metadata.byteSize)}</span>
                        <span className="meta-sep">•</span>
                        <span>🔤 {metadata.characterCount}</span>
                        <span className="meta-sep">•</span>
                        <span>📝 {metadata.wordCount} mots</span>
                    </div>
                )}
                {isMetaLoading && <div className="grim-meta-bar">⏳ Synchronisation...</div>}
                {metaError && <div className="grim-meta-bar error">⚠️ {metaError}</div>}
            </div>

            {showInfoModal && (
                <div className="grim-modal-overlay" onClick={() => setShowInfoModal(false)}>
                    <div className="grim-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="grim-modal-title">Aide Markdown</h2>
                        {/* Contenu aide simplifié */}
                        <div className="guide-item"><span>**Gras**</span> <span>Ctrl+B</span></div>
                        <div className="guide-item"><span>*Italique*</span> <span>Ctrl+I</span></div>
                        <button className="close-modal-btn" onClick={() => setShowInfoModal(false)}>Fermer</button>
                    </div>
                </div>
            )}

            {showErrorPopup && (
                <div className="grim-error-popup">
                    <div className="popup-icon">⚠️</div>
                    <div className="popup-text">{errorMessage}</div>
                </div>
            )}
        </div>
    );
};

export default NoteDetails;