import { createDirectory, updateDirectory, deleteDirectory } from "../../../services/directories/directoryService";
import { createNote } from "../../../services/notes/noteService"; // Import createNote
import { exportAsZip, exportAsPdf } from "../../../services/export/exportService";

interface TreeActionsProps {
    refreshTree: () => Promise<void>;
    modals: any;
    setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const useSidebarActions = ({ refreshTree, modals, setExpanded }: TreeActionsProps) => {

    // --- CREATE (Gère Dossier ET Note) ---
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modals.newFolderName.trim()) return;

        try {
            // Nettoyage de l'ID parent (ex: "dir-5" -> 5)
            let payloadId: number | null = null;
            if (modals.targetParentId !== "root") {
                // On retire le préfixe "dir-" s'il est présent
                const cleanId = modals.targetParentId.replace("dir-", "");
                payloadId = Number(cleanId);
            }

            if (modals.creationType === 'directory') {
                // 1. Création de Dossier
                await createDirectory({ name: modals.newFolderName, parentDirectoryId: payloadId });
            } else {
                // 2. Création de Note
                await createNote({ name: modals.newFolderName, directoryId: payloadId || 0 }); // 0 ou null selon ton backend si racine
            }

            await refreshTree();

            // Auto-expand du parent
            if (modals.targetParentId !== "root") {
                setExpanded(prev => ({ ...prev, [modals.targetParentId]: true }));
            }
            modals.setIsCreateOpen(false);
        } catch (error) {
            console.error(error);
            alert(`Erreur lors de la création (${modals.creationType}) !`);
        }
    };

    // --- RENAME ---
    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modals.renameTargetId && modals.renameValue.trim()) {
            try {
                // On doit savoir si c'est un dossier ou une note par son ID (dir-XX ou note-XX)
                const fullId = modals.renameTargetId as string;

                if (fullId.startsWith('dir-')) {
                    const realId = Number(fullId.replace("dir-", ""));
                    await updateDirectory({ id: realId, name: modals.renameValue });
                } else if (fullId.startsWith('note-')) {
                    // TODO: Activer quand updateNote supportera le renommage seul
                    alert("Le renommage de note se fait via l'éditeur pour le moment.");
                }

                await refreshTree();
                modals.setIsRenameOpen(false);
            } catch (error) {
                console.error("Erreur rename", error);
                alert("Impossible de renommer !");
            }
        }
    };

    // --- DELETE ---
    const handleDeleteConfirm = async () => {
        try {
            if (modals.deleteTargetId != null) {
                const fullId = modals.deleteTargetId as string;

                if (fullId.startsWith('dir-')) {
                    const realId = Number(fullId.replace("dir-", ""));
                    await deleteDirectory(realId);
                } else if (fullId.startsWith('note-')) {
                    // TODO: Activer quand deleteNote sera importé
                    alert("Suppression de note à venir...");
                }

                await refreshTree();
            }
        } catch (e) {
            console.error(e);
            alert("Impossible de supprimer !");
        } finally {
            modals.setIsDeleteOpen(false);
        }
    };

    // --- EXPORT ---
    const handleExportConfirm = async (format: 'zip' | 'pdf') => {
        modals.setIsExportOpen(false);
        const name = modals.exportTargetName || "Grimoire_Complet";
        // Export ne gère que les dossiers pour l'instant (ID directory)
        const rawId = modals.exportTargetId;
        const cleanId = rawId && rawId.startsWith('dir-') ? rawId.replace('dir-', '') : null;

        if (format === 'zip') {
            await exportAsZip(name, cleanId);
        } else {
            exportAsPdf(name, cleanId);
        }
    };

    return {
        handleCreateSubmit,
        handleRenameSubmit,
        handleDeleteConfirm,
        handleExportConfirm
    };
};