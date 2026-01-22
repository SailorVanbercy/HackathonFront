import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useEditor, EditorContent } from "@tiptap/react";
import "./NoteDetails.css"; // On garde le CSS au même niveau ou on update le path

// --- IMPORTS DES SOUS-COMPOSANTS ---
import Sidebar from "../SideBar/sidebar"; // Attention au path relatif

import { getEditorExtensions } from "./utils/editorExtensions";
import { NoteToolbar } from "./components/NoteToolbar";
import { NoteMetadataBar } from "./components/NoteMetadataBar";
import { LinkModal } from "./modals/LinkModal";
import { InfoModal } from "./modals/InfoModal";
import { useNoteHotkeys } from "./hooks/useNoteHotKeys";
import { useNoteStorage } from "./hooks/useNoteStorage";

const NoteDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- STATES UI ---
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkModalInitialUrl, setLinkModalInitialUrl] = useState("");

    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Refs pour éviter les closures
    const isReadOnlyRef = useRef(isReadOnly);
    const navigateRef = useRef(navigate);

    useEffect(() => { isReadOnlyRef.current = isReadOnly; }, [isReadOnly]);
    useEffect(() => { navigateRef.current = navigate; }, [navigate]);

    // --- EDITOR INIT (Doit être ici pour accès aux refs) ---
    const editor = useEditor({
        extensions: getEditorExtensions(),
        content: "",
        editable: true,
        editorProps: {
            attributes: { class: "tiptap-content" },
            handleDOMEvents: {
                blur: () => {
                    // On appellera le scheduleAutosave via le hook storage plus bas
                    // Mais comme 'storage' dépend de 'editor', on fait le pont via une ref ou effet
                    return false;
                },
            },
            handleClick: (_view, _pos, event) => {
                const target = event.target as HTMLElement;
                const link = target.closest("a");
                if (link && link.href) {
                    const url = new URL(link.href);
                    const currentOrigin = window.location.origin;
                    const isInternal = url.origin === currentOrigin && url.pathname.startsWith("/note/");

                    if (isInternal) {
                        event.preventDefault();
                        navigateRef.current(url.pathname);
                        return true;
                    }
                    return false;
                }
                return false;
            },
        },
        // OnUpdate est défini plus bas via useEffect pour lier avec le storage
    });

    // --- HOOKS LOGIQUE ---
    const storage = useNoteStorage(id, editor);

    // --- CONNECTION EDITOR <-> STORAGE ---
    // 1. Initialisation des données
    useEffect(() => {
        if (!id || !editor) return;
        storage.loadNoteData().then((data) => {
            if (data && editor && !editor.isDestroyed) {
                // Petit timeout pour laisser Tiptap respirer
                setTimeout(() => {
                    editor.commands.setContent(data.htmlContent);
                    storage.lastSavedContentRef.current = data.contentRaw ?? "";
                }, 0);
            }
        });
    }, [id, editor]); // Ne pas mettre storage pour éviter loop

    // 2. Gestion de l'Autosave sur changement (OnUpdate)
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = ({ transaction }: { transaction : {docChanged : boolean} }) => {
            if (!transaction.docChanged) return;
            storage.setSaveStatus("dirty");
            storage.scheduleAutosave();
        };

        editor.on('update', handleUpdate);
        editor.on('blur', () => storage.scheduleAutosave(0)); // Save immédiat au blur

        return () => {
            editor.off('update', handleUpdate);
            editor.off('blur');
        };
    }, [editor, storage.scheduleAutosave, storage.setSaveStatus]);

    // 3. Gestion Editable
    useEffect(() => {
        if (editor) editor.setEditable(!isReadOnly);
    }, [editor, isReadOnly]);

    // 4. Trigger Autosave si le titre change
    useEffect(() => {
        if (!editor) return;
        storage.setSaveStatus("dirty");
        storage.scheduleAutosave();
    }, [storage.title]);

    // --- GESTION LIENS ---
    const handleOpenLinkModal = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href || "";
        setLinkModalInitialUrl(previousUrl);
        setShowLinkModal(true);
    }, [editor]);

    const handleApplyLink = (url: string) => {
        if (!editor) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
    };

    // --- HOTKEYS ---
    useNoteHotkeys({
        editor,
        title: storage.title,
        id,
        currentDirectoryId: storage.currentDirectoryId,
        navigate,
        isReadOnly,
        setIsReadOnly,
        toggleInfoModal: () => setShowInfoModal(!showInfoModal),
        setSaveStatus: storage.setSaveStatus,
        setErrorMessage,
        setShowErrorPopup,
        refreshSidebar: storage.refreshSidebar
    });


    if (!editor) return null;

    return (
        <div className="grim-layout">
            <div className="grim-sidebar-wrapper">
                <Sidebar key={storage.sidebarKey} />
            </div>

            <div className={`grim-container ${isReadOnly ? "read-mode" : "edit-mode"}`}>
                <div className="grim-header">
                    <div className="grim-title-container">
                        {isReadOnly ? (
                            <h1 className="grim-title-display">{storage.title}</h1>
                        ) : (
                            <input
                                type="text"
                                className="grim-title-input"
                                value={storage.title}
                                onChange={(e) => storage.setTitle(e.target.value)}
                                placeholder="Titre du Sortilège..."
                            />
                        )}
                    </div>

                    {!isReadOnly && (
                        <NoteToolbar
                            editor={editor}
                            onOpenLinkModal={handleOpenLinkModal}
                            onOpenInfoModal={() => setShowInfoModal(true)}
                        />
                    )}

                    <div className="grim-actions">
                        {isReadOnly ? (
                            <button onClick={() => setIsReadOnly(false)} className="grim-btn edit-btn">
                                ✏️ Modifier
                            </button>
                        ) : (
                            <button onClick={() => setIsReadOnly(true)} className="grim-btn view-btn">
                                👁️
                            </button>
                        )}
                    </div>
                </div>

                <div className="grim-paper" onClick={() => !isReadOnly && editor.chain().focus().run()}>
                    <EditorContent editor={editor} />
                </div>

                <NoteMetadataBar
                    metadata={storage.metadata}
                    isLoading={storage.isMetaLoading}
                    error={storage.metaError}
                    saveStatus={storage.saveStatus}
                />
            </div>

            {/* MODALES */}
            <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

            <LinkModal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                onSubmit={handleApplyLink}
                initialUrl={linkModalInitialUrl}
            />

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