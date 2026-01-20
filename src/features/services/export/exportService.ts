import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
// import { DirectoryDTO } from './directories/directoryService';

export const exportAsZip = async (directoryName: string, _directoryId: string | null) => {
    try {
        const zip = new JSZip();
        const folder = zip.folder(directoryName);

        // TODO: Récupérer les vrais fichiers via une API ici si nécessaire
        folder?.file("Lisez-moi.txt", "Ce grimoire contient des secrets...\nID du dossier: " + (_directoryId || "Racine"));

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${directoryName}.zip`);
    } catch (error) {
        console.error("Échec du sortilège d'exportation ZIP", error);
        throw error;
    }
};

export const exportAsPdf = (directoryName: string, _directoryId: string | null) => {
    try {
        const doc = new jsPDF();

        doc.setFont("times", "bold");
        doc.setFontSize(22);
        doc.text(directoryName, 20, 20);

        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text("Contenu extrait du Grimoire...", 20, 40);
        // TODO: Lister le contenu du dossier ici

        doc.save(`${directoryName}.pdf`);
    } catch (error) {
        console.error("Échec du sortilège d'exportation PDF", error);
        throw error;
    }
};