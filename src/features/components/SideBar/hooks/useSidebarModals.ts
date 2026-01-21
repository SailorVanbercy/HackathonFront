import { useState } from "react";

export type CreationType = 'directory' | 'note';

export interface UseSidebarModalsType {
    // ... (Create, Rename, Delete inchangés) ...
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

    // --- EXPORT ---
    isExportOpen: boolean;
    setIsExportOpen: (v: boolean) => void;
    targetExportId: string | null;
    exportTargetName: string | undefined;
    // NOUVEAU : On stocke le type de l'élément à exporter
    exportItemType: 'directory' | 'note' | null;
    openExportModal: (id: string | null, name?: string, type?: 'directory' | 'note') => void;
}

export const useSidebarModals = (): UseSidebarModalsType => {

    // ... (Create, Rename, Delete states inchangés) ...
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

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [targetRenameId, setTargetRenameId] = useState<string | null>(null);

    const openRenameModal = (id: string, currentName: string) => {
        setTargetRenameId(id);
        setRenameValue(currentName);
        setIsRenameOpen(true);
    };

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
    const [exportItemType, setExportItemType] = useState<'directory' | 'note' | null>(null);

    const openExportModal = (id: string | null, name?: string, type: 'directory' | 'note' = 'directory') => {
        setTargetExportId(id);
        setExportTargetName(name);
        // Si id est null, c'est la racine, donc forcément un directory
        setExportItemType(id === null ? 'directory' : type);
        setIsExportOpen(true);
    };

    return {
        // ... (Exports existants) ...
        isCreateOpen, setIsCreateOpen, newFolderName, setNewFolderName, targetParentId, setTargetParentId, creationType, openCreateModal,
        isRenameOpen, setIsRenameOpen, renameValue, setRenameValue, targetRenameId, openRenameModal,
        isDeleteOpen, setIsDeleteOpen, targetDeleteId, openDeleteModal,

        // Export
        isExportOpen, setIsExportOpen,
        targetExportId,
        exportTargetName,
        exportItemType, // On expose le type
        openExportModal
    };
};