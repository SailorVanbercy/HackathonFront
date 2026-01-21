import { useCallback } from 'react';
import { createDirectory, updateDirectory, deleteDirectory } from '../../../services/directories/directoryService';
import { createNote } from '../../../services/notes/noteService';
import { exportAsZip, exportNoteAsPdf, exportNoteAsMarkdown } from '../../../services/export/exportService';
import type { UseSidebarModalsType, CreationType } from './useSidebarModals';

interface UseSidebarActionsProps {
    refreshTree: () => Promise<void>;
    modals: UseSidebarModalsType;
    setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const useSidebarActions = ({ refreshTree, modals, setExpanded }: UseSidebarActionsProps) => {

    const handleCreateSubmit = useCallback(async (name: string, parentId: number | null, type: CreationType) => {
        try {
            if (type === 'directory') {
                await createDirectory({ name, parentDirectoryId: parentId });
                if (parentId !== null) {
                    const parentNodeId = `dir-${parentId}`;
                    setExpanded((prev) => ({ ...prev, [parentNodeId]: true }));
                }
            } else {
                if (parentId === null || Number.isNaN(parentId)) throw new Error("Dossier invalide");
                await createNote({ name, directoryId: parentId });
                const parentNodeId = `dir-${parentId}`;
                setExpanded((prev) => ({ ...prev, [parentNodeId]: true }));
            }
            await refreshTree();
            modals.setIsCreateOpen(false);
            modals.setNewFolderName("");
        } catch (error) {
            console.error(error);
            alert("Erreur de création");
        }
    }, [refreshTree, modals, setExpanded]);

    const handleRenameSubmit = useCallback(async (id: string, newName: string) => {
        try {
            const cleanId = String(id).replace("dir-", "").replace("note-", "");
            await updateDirectory({ id: Number(cleanId), name: newName });
            await refreshTree();
            modals.setIsRenameOpen(false);
        } catch (error) { console.error(error); }
    }, [refreshTree, modals]);

    const handleDeleteConfirm = useCallback(async () => {
        const id = modals.targetDeleteId;
        if (!id) return;
        try {
            const cleanId = String(id).replace("dir-", "").replace("note-", "");
            await deleteDirectory(Number(cleanId));
            await refreshTree();
            modals.setIsDeleteOpen(false);
        } catch (error) { console.error(error); }
    }, [modals.targetDeleteId, refreshTree, modals]);

    // --- EXPORT (Mis à jour) ---
    const handleExportConfirm = useCallback(async (format: 'zip' | 'pdf' | 'md') => {
        const id = modals.targetExportId;
        const name = modals.exportTargetName || "Grimoire_Item";
        const type = modals.exportItemType;

        const cleanId = id ? String(id).replace("dir-", "").replace("note-", "") : null;
        const numId = cleanId ? Number(cleanId) : null;

        try {
            if (type === 'directory') {
                if (format === 'zip') await exportAsZip(name, cleanId);
            } else if (type === 'note' && numId !== null) {
                if (format === 'pdf') await exportNoteAsPdf(name, numId);
                else if (format === 'md') await exportNoteAsMarkdown(name, numId);
            }
            modals.setIsExportOpen(false);
        } catch (error) {
            console.error("Erreur export :", error);
            alert("L'exportation a échoué !");
        }
    }, [modals]);

    return { handleCreateSubmit, handleRenameSubmit, handleDeleteConfirm, handleExportConfirm };
};