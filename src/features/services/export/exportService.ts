import { saveAs } from 'file-saver';
import { getNoteById } from '../notes/noteService';

// Construction de l'URL de base pour l'export (ex: http://localhost:8080/api/export)
const API_URL = import.meta.env.VITE_API_URL + "/export";

const fetchNoteContent = async (noteId: number): Promise<string> => {
    try {
        const note = await getNoteById(noteId);
        return note.content || "";
    } catch (error) {
        console.error(`Erreur note ${noteId}`, error);
        return "Erreur de chargement.";
    }
};

// --- EXPORT DOSSIER (ZIP via Backend) ---
export const exportAsZip = async (directoryName: string) => {
    try {
        // Appel au backend pour générer le ZIP.
        // L'endpoint /zip/me exporte le dossier racine de l'utilisateur courant.
        const response = await fetch(`${API_URL}/zip/me`, {
            method: 'GET',
            credentials: 'include', // Nécessaire pour l'authentification (cookies/session)
        });

        if (!response.ok) {
            throw new Error("Échec du téléchargement du ZIP depuis le serveur");
        }

        const blob = await response.blob();
        saveAs(blob, `${directoryName}.zip`);
    } catch (error) {
        console.error("Échec export ZIP", error);
        throw error;
    }
};

// --- EXPORT NOTE (PDF via Backend) ---
export const exportNoteAsPdf = async (noteName: string, noteId: number) => {
    try {
        const response = await fetch(`${API_URL}/pdf/${noteId}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error("Échec du téléchargement du PDF depuis le serveur");
        }

        const blob = await response.blob();
        saveAs(blob, `${noteName}.pdf`);
    } catch (error) {
        console.error("Échec export PDF", error);
        throw error;
    }
};

// --- EXPORT NOTE (MARKDOWN - Client side) ---
export const exportNoteAsMarkdown = async (noteName: string, noteId: number) => {
    try {
        // L'export Markdown reste simple à faire côté client
        const content = await fetchNoteContent(noteId);
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        saveAs(blob, `${noteName}.md`);
    } catch (error) {
        console.error("Échec export MD", error);
        throw error;
    }
};