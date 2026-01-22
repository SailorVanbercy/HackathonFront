import { useHotkeys } from "react-hotkeys-hook";
import { Editor } from "@tiptap/react";
import TurndownService from "turndown";
import {createNote, getAllNotes, getNotesByDirectory, updateNote} from "../../../services/notes/noteService";
import type { NavigateFunction } from "react-router";
import {useRef} from "react";

interface UseNoteHotkeysProps {
    editor: Editor | null;
    title: string;
    id?: string;
    currentDirectoryId: number | null;
    navigate: NavigateFunction;
    isReadOnly: boolean;
    setIsReadOnly: (val: boolean) => void;
    toggleInfoModal: () => void;
    setSaveStatus: (status: "saved" | "saving" | "dirty") => void;
    setErrorMessage: (msg: string) => void;
    setShowErrorPopup: (val: boolean) => void;
    refreshSidebar: () => void;
}

export const useNoteHotkeys = ({
                                   editor,
                                   title,
                                   id,
                                   currentDirectoryId,
                                   navigate,
                                   isReadOnly,
                                   setIsReadOnly,
                                   toggleInfoModal,
                                   setSaveStatus,
                                   setErrorMessage,
                                   setShowErrorPopup,
                                   refreshSidebar,
                               }: UseNoteHotkeysProps) => {
    const config = { enableOnFormTags: true, enableOnContentEditable: true };
    const configPrevent = { ...config, preventDefault: true };

    // --- REFS POUR LE COOLDOWN ---
    const lastDuplicationRef = useRef<number>(0);

    // --- ACTIONS GLOBALES ---
    useHotkeys("alt+v", (e) => { e.preventDefault(); setIsReadOnly(!isReadOnly); }, configPrevent);
    useHotkeys("alt+i", (e) => { e.preventDefault(); toggleInfoModal(); }, configPrevent);
    useHotkeys("ctrl+enter", (e) => { e.preventDefault(); navigate("/home"); }, configPrevent);

    // --- FORMATAGE BASIQUE ---
    useHotkeys("alt+x", (e) => { e.preventDefault(); editor?.chain().focus().unsetAllMarks().clearNodes().run(); }, configPrevent);

    // --- LISTES ---
    useHotkeys("alt+l", (e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }, configPrevent);
    useHotkeys("alt+k", (e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }, configPrevent);


    // --- TITRES ---
    useHotkeys("ctrl+alt+1", (e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run(); }, configPrevent);
    useHotkeys("ctrl+alt+2", (e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run(); }, configPrevent);
    useHotkeys("ctrl+alt+3", (e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run(); }, configPrevent);
    useHotkeys("ctrl+alt+4", (e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 4 }).run(); }, configPrevent);
    useHotkeys("ctrl+alt+5", (e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 5 }).run(); }, configPrevent);
    useHotkeys("ctrl+alt+6", (e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 6 }).run(); }, configPrevent);

    // --- BLOCS SPECIAUX ---
    useHotkeys("alt+o", (e) => { e.preventDefault(); editor?.chain().focus().setHorizontalRule().run(); }, configPrevent);

    useHotkeys("alt+j", (e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }, configPrevent);
    useHotkeys("alt+s", (e) => { e.preventDefault(); editor?.chain().focus().toggleStrike().run(); }, configPrevent);

    useHotkeys("alt+c", (e) => { e.preventDefault(); editor?.chain().focus().toggleCodeBlock().run(); }, configPrevent);

    useHotkeys("alt+r", (e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run(); }, configPrevent);

    // --- FONCTIONS AVANCEES ---

    // Horodatage
    useHotkeys("alt+h", (e) => {
        e.preventDefault();
        if (!editor) return;
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') + 'min';
        const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        editor.chain().focus().insertContent(` ${formattedDate} ${timeStr} `).run();
    }, configPrevent);

    // Duplication de note (ALT + Y) AVEC COOLDOWN
    useHotkeys("alt+y", async (e) => {
        e.preventDefault();
        if (!editor || !id) return;

        // 1. VÉRIFICATION DU COOLDOWN (2.5 secondes)
        const now = Date.now();
        if (now - lastDuplicationRef.current < 2500) {
            console.log("⏳ Duplication en cooldown...");
            return;
        }
        lastDuplicationRef.current = now; // Mise à jour du timestamp

        setSaveStatus("saving");

        try {
            // 2. Préparer le contenu
            const html = editor.getHTML();
            const turndownService = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
            const markdown = turndownService.turndown(html);

            // 3. Récupérer les notes voisines
            let siblings: { name: string }[] = [];
            try {
                if (currentDirectoryId) {
                    const res = await getNotesByDirectory(currentDirectoryId);
                    siblings = res;
                } else {
                    const res = await getAllNotes();
                    siblings = res.filter((n: any) => n.directoryId === null);
                }
            } catch (e) {
                console.warn("Impossible de lister les frères pour le renommage, fallback.", e  );
            }

            // 4. Calculer le nouveau titre (Nom(1), Nom(2)...)
            const match = title.match(/^(.*)\((\d+)\)$/);
            let baseName = title;
            let startCounter = 1;

            if (match) {
                baseName = match[1];
                startCounter = parseInt(match[2], 10) + 1;
            }

            let newTitle = `${baseName}(${startCounter})`;
            let counter = startCounter;
            while (siblings.some(n => n.name === newTitle)) {
                counter++;
                newTitle = `${baseName}(${counter})`;
            }

            // 5. Création et Mise à jour
            const newNote = await createNote({ name: newTitle, directoryId: currentDirectoryId });
            await updateNote(newNote.id, { name: newTitle, content: markdown });

            refreshSidebar();
            navigate(`/note/${newNote.id}`);

        } catch (err) {
            console.error("Erreur duplication", err);
            setErrorMessage("Impossible de dupliquer le sortilège !");
            setShowErrorPopup(true);
            setSaveStatus("dirty");
        }
    }, { ...config, enableOnFormTags: true });
};