import { useState, useRef, useCallback, useEffect } from "react";
import { Editor } from "@tiptap/react";
import TurndownService from "turndown";
import { marked } from "marked";
import {
    getNoteById,
    updateNote,
    getMetaData,
    type MetaDataDTO
} from "../../../services/notes/noteService";
import { useNavigate } from "react-router";

export const useNoteStorage = (id: string | undefined, editor: Editor | null) => {
    const navigate = useNavigate();

    // State Données
    const [title, setTitle] = useState("");
    const [currentDirectoryId, setCurrentDirectoryId] = useState<number | null>(null);
    const [metadata, setMetadata] = useState<MetaDataDTO | null>(null);
    const [isMetaLoading, setIsMetaLoading] = useState(false);
    const [metaError, setMetaError] = useState<string | null>(null);

    // State Sauvegarde
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty">("saved");
    const [sidebarKey, setSidebarKey] = useState(0);

    // Refs pour comparaison
    const lastSavedTitleRef = useRef<string>("");
    const lastSavedContentRef = useRef<string>("");
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savingQueueRef = useRef<Promise<void>>(Promise.resolve());

    // --- FETCH DATA ---
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

    const loadNoteData = useCallback(async () => {
        if (!id) return;
        setIsMetaLoading(true);
        try {
            const note = await getNoteById(Number(id));
            setTitle(note.name);
            setCurrentDirectoryId(note.directoryId);
            lastSavedTitleRef.current = note.name;

            const htmlContent = note.content ? marked.parse(note.content) : "";

            // On retourne le contenu pour que l'éditeur puisse l'utiliser
            // (On ne peut pas setContent ici car 'editor' peut être null au premier render)
            fetchMetadata();
            return { htmlContent, contentRaw: note.content };
        } catch (err) {
            console.error("Erreur chargement:", err);
            navigate("/home");
            return null;
        } finally {
            setIsMetaLoading(false);
        }
    }, [id, navigate, fetchMetadata]);

    // --- SAVE LOGIC ---
    const saveNow = async () => {
        if (!editor || !id) return;

        // Vérif vide
        if (editor.getText().trim().length === 0) {
            setSaveStatus("dirty");
            return;
        }

        const html = editor.getHTML();
        const turndownService = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
        const markdown = turndownService.turndown(html);

        const titleChanged = title !== lastSavedTitleRef.current;
        const contentChanged = markdown !== lastSavedContentRef.current;

        if (!titleChanged && !contentChanged) {
            setSaveStatus("saved");
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
                    setSidebarKey((prev) => prev + 1); // Refresh sidebar
                    await fetchMetadata(true);
                } catch (err) {
                    console.error("Erreur save:", err);
                    setSaveStatus("dirty");
                }
            });

        await savingQueueRef.current;
    };

    const scheduleAutosave = (delay = 1500) => {
        if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = setTimeout(() => saveNow(), delay);
    };

    // --- LOCAL METADATA UPDATE (Compteur mots temps réel) ---
    useEffect(() => {
        if (!editor) return;
        const updateLocalMeta = () => {
            const plain = editor.getText();
            const countWords = (text: string) => (text.trim().match(/\S+/g) || []).length;
            const byteSize = new Blob([editor.getHTML()]).size;
            setMetadata((prev) =>
                prev ? { ...prev, characterCount: plain.length, wordCount: countWords(plain), byteSize } : prev
            );
        };
        editor.on("update", updateLocalMeta);
        return () => { editor.off("update", updateLocalMeta); };
    }, [editor]);

    const refreshSidebar = useCallback(() => {
        setSidebarKey((prev) => prev + 1);
    }, []);

    return {
        title,
        setTitle,
        currentDirectoryId,
        metadata,
        isMetaLoading,
        metaError,
        saveStatus,
        setSaveStatus,
        sidebarKey,
        refreshSidebar,
        loadNoteData,
        saveNow,
        scheduleAutosave,
        lastSavedContentRef
    };
};