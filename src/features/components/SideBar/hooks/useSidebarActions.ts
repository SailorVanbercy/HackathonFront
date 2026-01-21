import { useCallback } from 'react';
import { createDirectory, updateDirectory, deleteDirectory } from '../../../services/directories/directoryService';
import { createNote } from '../../../services/notes/noteService';
import { exportAsZip, exportAsPdf } from '../../../services/export/exportService';
import type { UseSidebarModalsType, CreationType } from './useSidebarModals';

interface UseSidebarActionsProps {
    refreshTree: () => Promise<void>;
    modals: UseSidebarModalsType;
    // CORRECTION TYPE : On aligne le type sur celui de useSidebarTree (Record au lieu de Set)
    setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const useSidebarActions = ({ refreshTree, modals, setExpanded }: UseSidebarActionsProps) => {

    const handleCreateSubmit = useCallback(async (name: string, parentId: number | null, type: CreationType) => {
        try {
            if (type === 'directory') {
                // Création Dossier
                await createDirectory({
                    name,
                    parentDirectoryId: parentId
                });

                // CORRECTION LOGIQUE : Si on a un parent, on l'ouvre pour voir le nouveau dossier
                if (parentId !== null) {
                    const parentNodeId = `dir-${parentId}`;
                    setExpanded((prev) => ({ ...prev, [parentNodeId]: true }));
                }
            } else {
                // Création Note
                if (parentId === null || Number.isNaN(parentId)) {
                    throw new Error("Une note doit être placée dans un dossier valide !");
                }

                await createNote({ name, directoryId: parentId });

                // CORRECTION LOGIQUE : On ouvre le dossier parent (format "dir-ID")
                const parentNodeId = `dir-${parentId}`;
                setExpanded((prev) => ({ ...prev, [parentNodeId]: true }));
            }

            await refreshTree();
            modals.setIsCreateOpen(false);
            modals.setNewFolderName("");
        } catch (error) {
            console.error("Erreur création :", error);
            alert(error instanceof Error ? error.message : "Impossible de créer l'élément.");
        }
    }, [refreshTree, modals, setExpanded]);

    // --- RENAME (Inchangé) ---
    const handleRenameSubmit = useCallback(async (id: string, newName: string) => {
        try {
            // id contient déjà "dir-" ou "note-" parfois, mais directoryService attend un nombre
            // On nettoie l'ID au cas où
            const cleanId = String(id).replace("dir-", "").replace("note-", "");
            await updateDirectory({ id: Number(cleanId), name: newName });
            await refreshTree();
            modals.setIsRenameOpen(false);
        } catch (error) {
            console.error("Erreur renommage :", error);
        }
    }, [refreshTree, modals]);

    // --- DELETE (Inchangé) ---
    const handleDeleteConfirm = useCallback(async () => {
        const id = modals.targetDeleteId;
        if (!id) return;
        try {
            const cleanId = String(id).replace("dir-", "").replace("note-", "");
            await deleteDirectory(Number(cleanId));
            await refreshTree();
            modals.setIsDeleteOpen(false);
        } catch (error) {
            console.error("Erreur suppression :", error);
        }
    }, [modals.targetDeleteId, refreshTree, modals]);

    // --- EXPORT (Inchangé) ---
    const handleExportConfirm = useCallback(async (format: 'zip' | 'pdf') => {
        const id = modals.targetExportId;
        // Pour l'export, on a besoin de l'ID nettoyé aussi si c'est un dossier spécifique
        const cleanId = id ? String(id).replace("dir-", "") : null;
        const name = modals.exportTargetName || "Grimoire_Complet";

        try {
            if (format === 'zip') await exportAsZip(name, cleanId);
            else await exportAsPdf(name, cleanId);
            modals.setIsExportOpen(false);
        } catch (error) {
            console.error("Erreur export :", error);
            alert("Le sortilège d'exportation a échoué !");
        }
    }, [modals]);

    return {
        handleCreateSubmit,
        handleRenameSubmit,
        handleDeleteConfirm,
        handleExportConfirm
    };
};