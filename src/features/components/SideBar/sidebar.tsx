import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { motion } from "framer-motion";
import "./sidebar.css";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { SidebarHeader } from "./SideBarPart/SidebarHeader";
import { SidebarTree } from "./SideBarPart/SidebarTree";
import { CreateFolderModal, CreateNoteModal, RenameModal, DeleteModal, ExportModal } from "./SideBarPart/SidebarModals";
import { useSidebarTree } from "./hooks/useSidebarTree";
import { useSidebarModals, type CreationType } from "./hooks/useSidebarModals";
import { useSidebarActions } from "./hooks/useSidebarActions";

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
    // 1. CORRECTION : On gère l'état de la recherche ICI
    const [search, setSearch] = useState("");

    // 2. CORRECTION : On passe la recherche au hook
    const tree = useSidebarTree(search);

    const modals = useSidebarModals();
    const actions = useSidebarActions({
        refreshTree: async () => { await tree.refreshTree(); if (props.onRefresh) props.onRefresh(); },
        modals,
        setExpanded: tree.setExpanded
    });

    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(280);

    // 3. CORRECTION : On stocke aussi le TYPE de la cible (dossier ou note)
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        targetId: string | null;
        targetType: 'directory' | 'note' | null
    }>({ x: 0, y: 0, targetId: null, targetType: null });

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);
    const toggleCollapse = () => setIsCollapsed(s => !s);

    const handleContextMenu = (e: React.MouseEvent, id: string, type: 'directory' | 'note') => {
        e.preventDefault();
        // On sauvegarde le type pour savoir quelles options afficher
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id, targetType: type });
    };

    const handleOpenRename = (id: string) => {
        const node = tree.allNodes.find((n) => n.id === id);
        if (node) {
            modals.openRenameModal(id, node.name);
            setContextMenu(p => ({ ...p, targetId: null }));
        }
    };

    const handleOpenDelete = (id: string) => {
        modals.openDeleteModal(id);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const handleOpenExport = (id: string | null) => {
        const node = id ? tree.allNodes.find((n) => n.id === id) : null;
        const type = node ? node.type : 'directory';
        modals.openExportModal(id, node?.name, type);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const handleOpenCreate = (parentId: string | null, type: CreationType = 'directory') => {
        let numParentId: number | null = null;
        if (parentId) {
            const cleanId = String(parentId).replace("dir-", "").replace("note-", "");
            const parsed = parseInt(cleanId, 10);
            if (!isNaN(parsed)) numParentId = parsed;
        }
        modals.openCreateModal(type, numParentId);
        setContextMenu(p => ({ ...p, targetId: null }));
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

    return (
        <>
            <aside ref={sidebarRef} className={`sidebar ${isCollapsed ? "collapsed" : ""}`} style={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="collapse-btn" onClick={toggleCollapse} title={isCollapsed ? "Ouvrir" : "Fermer"}>
                    <span className={`chevron ${isCollapsed ? "right" : "left"}`} />
                </motion.button>

                {!isCollapsed && (
                    <div className="sidebar-content" style={{ overflow: 'hidden', height: '100%' }}>
                        {/* 4. CORRECTION : On passe search et setSearch locaux */}
                        <SidebarHeader
                            search={search}
                            setSearch={setSearch}
                            isCollapsed={isCollapsed}
                            onOpenCreate={() => handleOpenCreate(null, 'directory')}
                        />
                        <div style={{ padding: '0 10px 10px 10px' }}>
                            <button onClick={() => handleOpenCreate(null, 'note')} style={{ width: '100%', padding: '6px', background: '#2a0a2e', border: '1px dashed #bfaFbF', color: '#bfaFbF', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                + Nouvelle Page
                            </button>
                        </div>
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

            {/* 5. CORRECTION : On passe targetType et onNewFolder */}
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                targetId={contextMenu.targetId}
                targetType={contextMenu.targetType}
                onClose={() => setContextMenu(p => ({ ...p, targetId: null }))}
                onRename={handleOpenRename}
                onDelete={handleOpenDelete}
                onExport={handleOpenExport}
                onNewFolder={(parentId: string | null) => handleOpenCreate(parentId, 'directory')}
            />

            {modals.isCreateOpen && modals.creationType === 'directory' && (
                <CreateFolderModal
                    isOpen={modals.isCreateOpen}
                    onClose={() => modals.setIsCreateOpen(false)}
                    onSubmit={actions.handleCreateFolder}
                    directories={tree.directories}
                />
            )}

            {modals.isCreateOpen && modals.creationType === 'note' && (
                <CreateNoteModal
                    isOpen={modals.isCreateOpen}
                    onClose={() => modals.setIsCreateOpen(false)}
                    onSubmit={actions.handleCreateNote}
                    directories={tree.directories}
                />
            )}

            <RenameModal isOpen={modals.isRenameOpen} onClose={() => modals.setIsRenameOpen(false)} onSubmit={actions.handleRenameSubmit} value={modals.renameValue} setValue={modals.setRenameValue} />
            <DeleteModal isOpen={modals.isDeleteOpen} onClose={() => modals.setIsDeleteOpen(false)} onConfirm={actions.handleDeleteConfirm} />
            <ExportModal isOpen={modals.isExportOpen} onClose={() => modals.setIsExportOpen(false)} onConfirm={actions.handleExportConfirm} folderName={modals.exportTargetName} itemType={modals.exportItemType || 'directory'} />
        </>
    );
});

export default Sidebar;