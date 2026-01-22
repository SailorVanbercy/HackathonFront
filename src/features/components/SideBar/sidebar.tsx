import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { GiMagicSwirl, GiHouse } from "react-icons/gi";
import "./sidebar.css";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { SidebarTree } from "./SideBarPart/SidebarTree";
import { CreateFolderModal, CreateNoteModal, RenameModal, DeleteModal, ExportModal } from "./SideBarPart/SidebarModals";
import { useSidebarTree } from "./hooks/useSidebarTree";
import { useSidebarModals, type CreationType } from "./hooks/useSidebarModals";
import { useSidebarActions } from "./hooks/useSidebarActions";
import {useHotkeys} from "react-hotkeys-hook";

export interface SidebarHandle {
    openCreateModal: () => void;
    openExportModal: () => void;
}

interface SidebarProps {
    onRefresh?: () => void;
}

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 460;
const SIDEBAR_COLLAPSED_WIDTH = 0;

const Sidebar = forwardRef<SidebarHandle, SidebarProps>((props, ref) => {
    // État de recherche
    const [search, setSearch] = useState("");

    const tree = useSidebarTree(search);
    const modals = useSidebarModals();

    const actions = useSidebarActions({
        refreshTree: async () => { await tree.refreshTree(); if (props.onRefresh) props.onRefresh(); },
        modals,
        setExpanded: tree.setExpanded
    });

    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(280);

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        targetId: string | null | undefined;
        targetType: 'directory' | 'note' | null
    }>({ x: 0, y: 0, targetId: undefined, targetType: null });

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);

    const toggleCollapse = () => setIsCollapsed(s => !s);

    const handleContextMenu = (e: React.MouseEvent, id: string | null, type: 'directory' | 'note') => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id, targetType: type });
    };

    const handleRootInvocation = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({
            x: rect.left,
            y: rect.bottom + 5,
            targetId: null, // null = Root
            targetType: 'directory'
        });
    };

    const handleOpenRename = (id: string) => {
        const node = tree.allNodes.find((n) => n.id === id);
        if (node) {
            modals.openRenameModal(id, node.name);
            setContextMenu(p => ({ ...p, targetId: undefined }));
        }
    };

    const handleOpenDelete = (id: string) => {
        modals.openDeleteModal(id);
        setContextMenu(p => ({ ...p, targetId: undefined }));
    };

    const handleOpenExport = (id: string | null) => {
        const node = id ? tree.allNodes.find((n) => n.id === id) : null;
        const type = node ? node.type : 'directory';
        modals.openExportModal(id, node?.name, type);
        setContextMenu(p => ({ ...p, targetId: undefined }));
    };

    const handleOpenCreate = (parentId: string | null, type: CreationType = 'directory') => {
        let numParentId: number | null = null;
        if (parentId) {
            const cleanId = String(parentId).replace("dir-", "").replace("note-", "");
            const parsed = parseInt(cleanId, 10);
            if (!isNaN(parsed)) numParentId = parsed;
        }
        modals.openCreateModal(type, numParentId);
        setContextMenu(p => ({ ...p, targetId: undefined }));
    };

    useImperativeHandle(ref, () => ({
        openCreateModal: () => modals.openCreateModal('directory', null),
        openExportModal: () => modals.openExportModal(null)
    }));

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!resizingRef.current || !sidebarRef.current) return;
            const newW = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, newW)));
        };
        const onUp = () => {
            resizingRef.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, []);

    // Raccourcis clavier
    useHotkeys('alt+n', (e) => {
        e.preventDefault();
        modals.openCreateModal('note', null);
    }, {enableOnFormTags: true, preventDefault: true}, [modals]);
    useHotkeys('alt+d', (e) => {
        e.preventDefault();
        modals.openCreateModal('directory', null);
    }, {enableOnFormTags: true}, [modals]);
    useHotkeys('alt+t', (e) => {
        e.preventDefault();
        toggleCollapse();
    }, {enableOnFormTags: true}, [modals]);

    // MODIFIÉ : Alt+G ouvre maintenant l'export en mode global (4ème paramètre = true)
    useHotkeys('alt+g', (e) => {
        e.preventDefault();
        modals.openExportModal(null, undefined, 'directory', true);
    }, {enableOnFormTags: true}, [modals]);


    return (
        <>
            <aside ref={sidebarRef} className={`sidebar ${isCollapsed ? "collapsed" : ""}`} style={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="collapse-btn" onClick={toggleCollapse} title={isCollapsed ? "Ouvrir" : "Fermer"}>
                    <span className={`chevron ${isCollapsed ? "right" : "left"}`} />
                </motion.button>

                {!isCollapsed && (
                    <div className="sidebar-content" style={{ overflow: 'hidden', height: '100%' }}>

                        {/* --- NOUVELLE GRILLE DE HEADER --- */}
                        <div className="sidebar-grid">
                            {/* 1. Bouton Home */}
                            <button className="sidebar-home-btn" title="Accueil">
                                <span className="home-icon"><GiHouse size={20} /></span>
                            </button>

                            {/* 2. Barre de Recherche */}
                            <div className="search-wrap">
                                <span className="search-ico">🕸️</span>
                                <input
                                    type="text"
                                    className="sidebar-search"
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* 3. Bouton Invocation */}
                            <button
                                className="invocation-btn"
                                onClick={handleRootInvocation}
                            >
                                <GiMagicSwirl /> Invocation (Racine)
                            </button>
                        </div>
                        {/* --- FIN GRILLE --- */}

                        <SidebarTree
                            isLoading={tree.isLoading}
                            visibleItems={tree.visibleItems}
                            expanded={tree.expanded}
                            matchSet={tree.matchSet}
                            activeId={tree.activeId}
                            isCollapsed={isCollapsed}
                            onToggleExpand={tree.toggleExpand}
                            onSelect={tree.setActiveId}
                            onContextMenu={handleContextMenu}
                        />
                    </div>
                )}
                {!isCollapsed && (
                    <div className="resize-handle" onMouseDown={(e) => { e.preventDefault(); resizingRef.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }} />
                )}
            </aside>

            {contextMenu.targetId !== undefined && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    targetId={contextMenu.targetId}
                    targetType={contextMenu.targetType}
                    onClose={() => setContextMenu(p => ({ ...p, targetId: undefined }))}
                    onRename={handleOpenRename}
                    onDelete={handleOpenDelete}
                    onExport={handleOpenExport}
                    onNewFolder={(parentId) => handleOpenCreate(parentId, 'directory')}
                    onNewNote={(parentId) => handleOpenCreate(parentId, 'note')}
                />
            )}

            {modals.isCreateOpen && modals.creationType === 'directory' && (
                <CreateFolderModal
                    isOpen={modals.isCreateOpen}
                    onClose={() => modals.setIsCreateOpen(false)}
                    onSubmit={actions.handleCreateFolder}
                    targetParentId={modals.targetParentId}
                />
            )}

            {modals.isCreateOpen && modals.creationType === 'note' && (
                <CreateNoteModal
                    isOpen={modals.isCreateOpen}
                    onClose={() => modals.setIsCreateOpen(false)}
                    onSubmit={actions.handleCreateNote}
                    targetDirectoryId={modals.targetParentId}
                />
            )}

            <RenameModal isOpen={modals.isRenameOpen} onClose={() => modals.setIsRenameOpen(false)} onSubmit={actions.handleRenameSubmit} value={modals.renameValue} setValue={modals.setRenameValue} />
            <DeleteModal isOpen={modals.isDeleteOpen} onClose={() => modals.setIsDeleteOpen(false)} onConfirm={actions.handleDeleteConfirm} />

            {/* MODIFIÉ : On passe la propriété isGlobal */}
            <ExportModal
                isOpen={modals.isExportOpen}
                onClose={() => modals.setIsExportOpen(false)}
                onConfirm={actions.handleExportConfirm}
                folderName={modals.exportTargetName}
                itemType={modals.exportItemType || 'directory'}
                isGlobal={modals.isGlobalExport}
            />
        </>
    );
});

export default Sidebar;