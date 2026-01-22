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

    // Data State
    const [title, setTitle] = useState("");
    const [currentDirectoryId, setCurrentDirectoryId] = useState<number | null>(null);
    const [metadata, setMetadata] = useState<MetaDataDTO | null>(null);
    const [isMetaLoading, setIsMetaLoading] = useState(false);
    const [metaError, setMetaError] = useState<string | null>(null);

    // Save State
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty">("saved");
    const [sidebarKey, setSidebarKey] = useState(0);

    // Refs used to compare current content with the last saved version to avoid unnecessary API calls
    const lastSavedTitleRef = useRef<string>("");
    const lastSavedContentRef = useRef<string>("");
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Queue to handle sequential saves and prevent race conditions
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

            // Convert Markdown from DB to HTML for the Tiptap editor
            const htmlContent = note.content ? marked.parse(note.content) : "";

            // Return content instead of setting it directly to handle editor initialization timing
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

        // Prevent saving empty notes if that's a business rule (or just update UI status)
        if (editor.getText().trim().length === 0) {
            setSaveStatus("dirty");
            return;
        }

        const html = editor.getHTML();
        // Convert HTML back to Markdown for storage
        const turndownService = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
        const markdown = turndownService.turndown(html);

        const titleChanged = title !== lastSavedTitleRef.current;
        const contentChanged = markdown !== lastSavedContentRef.current;

        // Optimization: Do nothing if no changes detected
        if (!titleChanged && !contentChanged) {
            setSaveStatus("saved");
            return;
        }

        setSaveStatus("saving");

        // Chain save requests to ensure order (FIFO)
        savingQueueRef.current = savingQueueRef.current
            .catch(() => {}) // Ignore previous errors to keep the queue moving
            .then(async () => {
                try {
                    await updateNote(Number(id), { name: title, content: markdown });

                    // Update refs only after successful save
                    lastSavedTitleRef.current = title;
                    lastSavedContentRef.current = markdown;

                    setSaveStatus("saved");
                    setSidebarKey((prev) => prev + 1); // Trigger sidebar refresh (e.g. if title changed)
                    await fetchMetadata(true);
                } catch (err) {
                    console.error("Erreur save:", err);
                    setSaveStatus("dirty");
                }
            });

        await savingQueueRef.current;
    };

    // Debounce logic for autosave
    const scheduleAutosave = (delay = 1500) => {
        if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = setTimeout(() => saveNow(), delay);
    };

    // --- LOCAL METADATA UPDATE (Real-time word count) ---
    useEffect(() => {
        if (!editor) return;
        const updateLocalMeta = () => {
            const plain = editor.getText();
            const countWords = (text: string) => (text.trim().match(/\S+/g) || []).length;
            // Calculate approximate byte size of HTML content
            const byteSize = new Blob([editor.getHTML()]).size;

            // Optimistically update metadata in UI without waiting for backend
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