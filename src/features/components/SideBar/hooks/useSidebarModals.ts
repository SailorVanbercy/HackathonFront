import { useState } from "react";

export type CreationType = 'directory' | 'note';

// Interface exposée pour useSidebarActions
export interface UseSidebarModalsType {
    isCreateOpen: boolean;
    setIsCreateOpen: (v: boolean) => void;
    newFolderName: string;
    setNewFolderName: (v: string) => void;
    targetParentId: number | null;
    setTargetParentId: (v: number | null) => void;
    creationType: CreationType;
    openCreateModal: (type: CreationType, parentId?: number | null) => void;

    isRenameOpen: boolean;
    setIsRenameOpen: (v: boolean) => void;
    renameValue: string;
    setRenameValue: (v: string) => void;
    targetRenameId: string | null;
    openRenameModal: (id: string, currentName: string) => void;

    isDeleteOpen: boolean;
    setIsDeleteOpen: (v: boolean) => void;
    targetDeleteId: string | null;
    openDeleteModal: (id: string) => void;

    isExportOpen: boolean;
    setIsExportOpen: (v: boolean) => void;
    targetExportId: string | null;
    exportTargetName: string | undefined;
    openExportModal: (id: string | null, name?: string) => void;
}

export const useSidebarModals = (): UseSidebarModalsType => {

    // --- CREATE ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [targetParentId, setTargetParentId] = useState<number | null>(null);
    const [creationType, setCreationType] = useState<CreationType>('directory');

    const openCreateModal = (type: CreationType, parentId: number | null = null) => {
        setCreationType(type);
        setNewFolderName("");
        setTargetParentId(parentId);
        setIsCreateOpen(true);
    };

    // --- RENAME ---
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [targetRenameId, setTargetRenameId] = useState<string | null>(null);

    const openRenameModal = (id: string, currentName: string) => {
        setTargetRenameId(id);
        setRenameValue(currentName);
        setIsRenameOpen(true);
    };

    // --- DELETE ---
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

    const openDeleteModal = (id: string) => {
        setTargetDeleteId(id);
        setIsDeleteOpen(true);
    };

    // --- EXPORT ---
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [targetExportId, setTargetExportId] = useState<string | null>(null);
    const [exportTargetName, setExportTargetName] = useState<string | undefined>(undefined);

    const openExportModal = (id: string | null, name?: string) => {
        setTargetExportId(id);
        setExportTargetName(name);
        setIsExportOpen(true);
    };

    return {
        // Create
        isCreateOpen, setIsCreateOpen,
        newFolderName, setNewFolderName,
        targetParentId, setTargetParentId,
        creationType,
        openCreateModal,

        // Rename
        isRenameOpen, setIsRenameOpen,
        renameValue, setRenameValue,
        targetRenameId,
        openRenameModal,

        // Delete
        isDeleteOpen, setIsDeleteOpen,
        targetDeleteId,
        openDeleteModal,

        // Export
        isExportOpen, setIsExportOpen,
        targetExportId,
        exportTargetName,
        openExportModal
    };
};