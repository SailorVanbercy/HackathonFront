import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { getAllNotes, getNoteById } from '../notes/noteService';
import { getAllDirectories } from '../directories/directoryService';

const fetchNoteContent = async (noteId: number): Promise<string> => {
    try {
        const note = await getNoteById(noteId);
        return note.content || "";
    } catch (error) {
        console.error(`Erreur note ${noteId}`, error);
        return "Erreur de chargement.";
    }
};

// --- EXPORT DOSSIER (ZIP RÉCURSIF) ---
export const exportAsZip = async (directoryName: string, directoryId: string | null) => {
    try {
        const zip = new JSZip();
        const rootZipFolder = zip.folder(directoryName);
        const [allDirs, allNotes] = await Promise.all([getAllDirectories(), getAllNotes()]);

        const addContentToZip = async (currentZipFolder: JSZip | null, currentDbId: number | null) => {
            // Notes
            const notesHere = allNotes.filter(n => {
                if (currentDbId === null) return n.directoryId === 0 || n.directoryId === null;
                return n.directoryId === currentDbId;
            });
            await Promise.all(notesHere.map(async (note) => {
                const content = await fetchNoteContent(note.id);
                currentZipFolder?.file(`${note.name}.md`, content);
            }));

            // Sous-dossiers
            const dirsHere = allDirs.filter(d => {
                if (currentDbId === null) return d.parentDirectoryId === 0 || d.parentDirectoryId === null;
                return d.parentDirectoryId === currentDbId;
            });
            for (const subDir of dirsHere) {
                const newZipSubFolder = currentZipFolder?.folder(subDir.name) || null;
                await addContentToZip(newZipSubFolder, subDir.id);
            }
        };

        const startId = directoryId ? Number(directoryId) : null;
        await addContentToZip(rootZipFolder, startId);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${directoryName}.zip`);
    } catch (error) {
        console.error("Échec export ZIP", error);
        throw error;
    }
};

// --- EXPORT NOTE (PDF) ---
export const exportNoteAsPdf = async (noteName: string, noteId: number) => {
    try {
        const doc = new jsPDF();
        const content = await fetchNoteContent(noteId);
        doc.setFont("times", "bold");
        doc.setFontSize(20);
        doc.text(noteName, 20, 20);

        doc.setFont("times", "normal");
        doc.setFontSize(12);
        const splitContent = doc.splitTextToSize(content, 170);
        doc.text(splitContent, 20, 40);

        doc.save(`${noteName}.pdf`);
    } catch (error) {
        console.error("Échec export PDF", error);
        throw error;
    }
};

// --- EXPORT NOTE (MARKDOWN) ---
export const exportNoteAsMarkdown = async (noteName: string, noteId: number) => {
    try {
        const content = await fetchNoteContent(noteId);
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        saveAs(blob, `${noteName}.md`);
    } catch (error) {
        console.error("Échec export MD", error);
        throw error;
    }
};