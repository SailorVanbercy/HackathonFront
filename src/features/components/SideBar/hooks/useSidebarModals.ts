import { useState } from "react";

export const useSidebarModals = () => {
    // --- CREATE ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [targetParentId, setTargetParentId] = useState<string>("root");

    const openCreateModal = (parentId: string | null = null) => {
        setNewFolderName("");
        setTargetParentId(parentId || "root");
        setIsCreateOpen(true);
    };

    // --- RENAME ---
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [renameTargetId, setRenameTargetId] = useState<string | null>(null);

    const openRenameModal = (id: string, currentName: string) => {
        setRenameTargetId(id);
        setRenameValue(currentName);
        setIsRenameOpen(true);
    };

    // --- DELETE ---
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const openDeleteModal = (id: string) => {
        setDeleteTargetId(id);
        setIsDeleteOpen(true);
    };

    // --- EXPORT ---
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [exportTargetId, setExportTargetId] = useState<string | null>(null);
    const [exportTargetName, setExportTargetName] = useState<string | undefined>(undefined);

    const openExportModal = (id: string | null, name?: string) => {
        setExportTargetId(id);
        setExportTargetName(name);
        setIsExportOpen(true);
    };

    return {
        // Create
        isCreateOpen, setIsCreateOpen,
        newFolderName, setNewFolderName,
        targetParentId, setTargetParentId,
        openCreateModal,

        // Rename
        isRenameOpen, setIsRenameOpen,
        renameValue, setRenameValue,
        renameTargetId,
        openRenameModal,

        // Delete
        isDeleteOpen, setIsDeleteOpen,
        deleteTargetId,
        openDeleteModal,

        // Export
        isExportOpen, setIsExportOpen,
        exportTargetId,
        exportTargetName,
        openExportModal
    };
};