import { useState } from "react";

export type CreationType = 'directory' | 'note';

export interface UseSidebarModalsType {
    // CREATE
    isCreateOpen: boolean;
    setIsCreateOpen: (v: boolean) => void;
    creationType: CreationType;
    targetParentId: number | null;
    // CORRECTION : Ajout de la définition manquante
    setTargetParentId: (v: number | null) => void;
    openCreateModal: (type: CreationType, parentId?: number | null) => void;

    // RENAME
    isRenameOpen: boolean;
    setIsRenameOpen: (v: boolean) => void;
    renameValue: string;
    setRenameValue: (v: string) => void;
    targetRenameId: string | null;
    openRenameModal: (id: string, currentName: string) => void;

    // DELETE
    isDeleteOpen: boolean;
    setIsDeleteOpen: (v: boolean) => void;
    targetDeleteId: string | null;
    openDeleteModal: (id: string) => void;

    // EXPORT
    isExportOpen: boolean;
    setIsExportOpen: (v: boolean) => void;
    targetExportId: string | null;
    exportTargetName: string | undefined;
    exportItemType: 'directory' | 'note' | null;
    openExportModal: (id: string | null, name?: string, type?: 'directory' | 'note') => void;
}

export const useSidebarModals = (): UseSidebarModalsType => {
    // CREATE
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [targetParentId, setTargetParentId] = useState<number | null>(null);
    const [creationType, setCreationType] = useState<CreationType>('directory');

    const openCreateModal = (type: CreationType, parentId: number | null = null) => {
        setCreationType(type);
        setTargetParentId(parentId);
        setIsCreateOpen(true);
    };

    // RENAME
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [targetRenameId, setTargetRenameId] = useState<string | null>(null);

    const openRenameModal = (id: string, currentName: string) => {
        setTargetRenameId(id);
        setRenameValue(currentName);
        setIsRenameOpen(true);
    };

    // DELETE
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

    const openDeleteModal = (id: string) => {
        setTargetDeleteId(id);
        setIsDeleteOpen(true);
    };

    // EXPORT
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [targetExportId, setTargetExportId] = useState<string | null>(null);
    const [exportTargetName, setExportTargetName] = useState<string | undefined>(undefined);
    const [exportItemType, setExportItemType] = useState<'directory' | 'note' | null>(null);

    const openExportModal = (id: string | null, name?: string, type: 'directory' | 'note' = 'directory') => {
        setTargetExportId(id);
        setExportTargetName(name);
        setExportItemType(id === null ? 'directory' : type);
        setIsExportOpen(true);
    };

    return {
        // CREATE
        isCreateOpen,
        setIsCreateOpen,
        targetParentId,
        setTargetParentId, // Plus besoin de 'as any'
        creationType,
        openCreateModal,

        // RENAME
        isRenameOpen, setIsRenameOpen, renameValue, setRenameValue, targetRenameId, openRenameModal,

        // DELETE
        isDeleteOpen, setIsDeleteOpen, targetDeleteId, openDeleteModal,

        // EXPORT
        isExportOpen, setIsExportOpen, targetExportId, exportTargetName, exportItemType, openExportModal
    };
};