import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { getAllNotes, getNotesByDirectory, getNoteById } from '../notes/noteService'; //

//Fonction utilitaire pour récupérer le contenu texte d'une note
const fetchNoteContent = async (noteId: number): Promise<string> => {
    try {
        const note = await getNoteById(noteId); //
        return note.content || "";
    } catch (error) {
        console.error(`Erreur lors de la lecture de la note ${noteId}`, error);
        return "Contenu indéchiffrable (Erreur de chargement).";
    }
};

export const exportAsZip = async (directoryName: string, directoryId: string | null) => {
    try {
        const zip = new JSZip();
        const folder = zip.folder(directoryName);

        // 1. Récupérer la liste des notes (du dossier ou globales)
        let notesToExport: { id: number; name: string }[] = [];

        if (directoryId) {
            // Récupération par dossier
            const fetched = await getNotesByDirectory(Number(directoryId));
            notesToExport = fetched.map(n => ({ id: n.id, name: n.name }));
        } else {
            // Récupération globale (Racine/Tout)
            const fetched = await getAllNotes();
            notesToExport = fetched.map(n => ({ id: n.id, name: n.name }));
        }

        // 2. Pour chaque note, récupérer son contenu et l'ajouter au ZIP
        // On utilise Promise.all pour paralléliser les requêtes et aller plus vite
        await Promise.all(notesToExport.map(async (note) => {
            const content = await fetchNoteContent(note.id);
            folder?.file(`${note.name}.md`, content); // On sauvegarde en Markdown
        }));

        // 3. Générer et télécharger le ZIP
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${directoryName}.zip`);

    } catch (error) {
        console.error("Échec du sortilège d'exportation ZIP", error);
        throw error;
    }
};

export const exportAsPdf = async (directoryName: string, directoryId: string | null) => {
    try {
        const doc = new jsPDF();

        // Page de titre
        doc.setFont("times", "bold");
        doc.setFontSize(24);
        doc.text(directoryName, 20, 30);
        doc.setFontSize(12);
        doc.setFont("times", "italic");
        doc.text("Export du Grimoire", 20, 40);

        // 1. Récupérer la liste
        let notesToExport: { id: number; name: string }[] = [];

        if (directoryId) {
            const fetched = await getNotesByDirectory(Number(directoryId)); //
            notesToExport = fetched.map(n => ({ id: n.id, name: n.name }));
        } else {
            const fetched = await getAllNotes(); //
            notesToExport = fetched.map(n => ({ id: n.id, name: n.name }));
        }

        let yOffset = 60;
        const pageHeight = doc.internal.pageSize.height;

        // 2. Parcourir et ajouter chaque note au PDF
        for (const note of notesToExport) {
            const content = await fetchNoteContent(note.id);

            // Gestion simple du saut de page si on est trop bas
            if (yOffset > pageHeight - 40) {
                doc.addPage();
                yOffset = 20;
            }

            // Titre de la note
            doc.setFont("times", "bold");
            doc.setFontSize(16);
            doc.text(note.name, 20, yOffset);
            yOffset += 10;

            // Contenu de la note
            doc.setFont("times", "normal");
            doc.setFontSize(12);

            // splitTextToSize coupe le texte pour qu'il tienne dans la largeur (170mm)
            const splitContent = doc.splitTextToSize(content, 170);

            // Vérification de la place pour le contenu
            if (yOffset + (splitContent.length * 7) > pageHeight - 20) {
                doc.addPage();
                yOffset = 20;
            }

            doc.text(splitContent, 20, yOffset);

            // Espace après la note
            yOffset += (splitContent.length * 7) + 20;
        }

        doc.save(`${directoryName}.pdf`);
    } catch (error) {
        console.error("Échec du sortilège d'exportation PDF", error);
        throw error;
    }
};