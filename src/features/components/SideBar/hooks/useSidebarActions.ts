import { createDirectory, updateDirectory, deleteDirectory } from "../../../services/directories/directoryService";
import { exportAsZip, exportAsPdf } from "../../../services/export/exportService";

// On définit les types minimalistes dont on a besoin en entrée
interface TreeActionsProps {
    refreshTree: () => Promise<void>;
    modals: any; // On pourrait typer plus strictement avec ReturnType<typeof useSidebarModals>
    setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const useSidebarActions = ({ refreshTree, modals, setExpanded }: TreeActionsProps) => {

    // --- CREATE ---
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modals.newFolderName.trim()) return;

        try {
            const payloadId = modals.targetParentId === "root" ? null : Number(modals.targetParentId);
            const newDir = await createDirectory({ name: modals.newFolderName, parentDirectoryId: payloadId });

            await refreshTree();

            // Auto-expand du parent pour voir le nouveau dossier
            if (payloadId !== null) {
                setExpanded(prev => ({ ...prev, [String(payloadId)]: true }));
            }
            modals.setIsCreateOpen(false);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'invocation du dossier !");
        }
    };

    // --- RENAME ---
    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modals.renameTargetId && modals.renameValue.trim()) {
            try {
                await updateDirectory({
                    id: parseInt(modals.renameTargetId),
                    name: modals.renameValue
                });
                await refreshTree();
                modals.setIsRenameOpen(false);
            } catch (error) {
                console.error("Erreur rename", error);
                alert("Impossible de renommer ce parchemin !");
            }
        }
    };

    // --- DELETE ---
    const handleDeleteConfirm = async () => {
        try {
            if (modals.deleteTargetId != null) {
                await deleteDirectory(parseInt(modals.deleteTargetId));
                await refreshTree();
            }
        } catch (e) {
            console.error(e);
            alert("Impossible de détruire ce dossier !");
        } finally {
            modals.setIsDeleteOpen(false);
        }
    };

    // --- EXPORT ---
    const handleExportConfirm = async (format: 'zip' | 'pdf') => {
        modals.setIsExportOpen(false);
        const name = modals.exportTargetName || "Grimoire_Complet";
        const id = modals.exportTargetId;

        if (format === 'zip') {
            await exportAsZip(name, id);
        } else {
            exportAsPdf(name, id);
        }
    };

    return {
        handleCreateSubmit,
        handleRenameSubmit,
        handleDeleteConfirm,
        handleExportConfirm
    };
};