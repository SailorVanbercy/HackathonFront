import React, {
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    forwardRef
} from "react";
import { motion } from "framer-motion";
import "./sidebar.css";

// --- COMPOSANTS UI ---
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { SidebarHeader } from "./SideBarPart/SidebarHeader";
import { SidebarTree } from "./SideBarPart/SidebarTree";
import { CreateFolderModal, RenameModal, DeleteModal, ExportModal } from "./SideBarPart/SidebarModals";

// --- HOOKS ---
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

    const tree = useSidebarTree();
    const modals = useSidebarModals();

    const actions = useSidebarActions({
        refreshTree: tree.refreshTree,
        modals,
        setExpanded: tree.setExpanded
    });

    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(280);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null }>({ x: 0, y: 0, targetId: null });

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);

    const toggleCollapse = () => setIsCollapsed(s => !s);

    const handleContextMenu = (e: React.MouseEvent, id: string, type: 'directory' | 'note') => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id });
    };

    const handleOpenRename = (id: string) => {
        const node = tree.allNodes.find((n: { id: string; }) => n.id === id);
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
        const node = id ? tree.allNodes.find((n: { id: string; }) => n.id === id) : null;
        modals.openExportModal(id, node?.name);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const handleOpenCreate = (parentId: string | null, type: CreationType = 'directory') => {
        // IMPORTANT : Conversion string -> number si l'ID vient du tree ou du context menu
        const numParentId = parentId ? Number(parentId) : null;
        modals.openCreateModal(type, numParentId);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    // Wrapper essentiel pour notifier la HomePage qu'une note a été créée
    const handleCreateSubmitWrapper = async (name: string, parentId: number | null, type: CreationType) => {
        await actions.handleCreateSubmit(name, parentId, type);
        if (props.onRefresh) {
            props.onRefresh();
        }
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
            <aside
                ref={sidebarRef}
                className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
                style={{
                    width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth,
                    position: 'relative'
                }}
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="collapse-btn"
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Ouvrir le Grimoire" : "Fermer"}
                >
                    <span className={`chevron ${isCollapsed ? "right" : "left"}`} />
                </motion.button>

                {!isCollapsed && (
                    <div className="sidebar-content" style={{ overflow: 'hidden', height: '100%' }}>
                        <SidebarHeader
                            search={tree.search}
                            setSearch={tree.setSearch}
                            isCollapsed={isCollapsed}
                            onOpenCreate={() => handleOpenCreate(null, 'directory')}
                        />

                        <div style={{ padding: '0 10px 10px 10px' }}>
                            {/* Bouton pour créer une note rapidement */}
                            <button
                                onClick={() => handleOpenCreate(null, 'note')}
                                style={{
                                    width: '100%', padding: '6px', background: '#2a0a2e',
                                    border: '1px dashed #bfaFbF', color: '#bfaFbF', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '0.8rem'
                                }}
                            >
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
                    <div
                        className="resize-handle"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            resizingRef.current = true;
                            document.body.style.cursor = "col-resize";
                            document.body.style.userSelect = "none";
                        }}
                    />
                )}
            </aside>

            {/* Menu Contextuel */}
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                targetId={contextMenu.targetId}
                onClose={() => setContextMenu(p => ({ ...p, targetId: null }))}
                onRename={handleOpenRename}
                onDelete={handleOpenDelete}
                onExport={handleOpenExport}
                // @ts-expect-error - onNewFolder passe un string, handleOpenCreate gère la conversion
                onNewFolder={(parentId) => handleOpenCreate(parentId, 'directory')}
            />

            {/* Modales */}
            <CreateFolderModal
                isOpen={modals.isCreateOpen}
                onClose={() => modals.setIsCreateOpen(false)}
                onSubmit={handleCreateSubmitWrapper}
                folderName={modals.newFolderName}
                setFolderName={modals.setNewFolderName}
                parentId={modals.targetParentId}
                setParentId={modals.setTargetParentId}
                treeData={tree.treeData}
                creationType={modals.creationType}
            />
            <RenameModal
                isOpen={modals.isRenameOpen}
                onClose={() => modals.setIsRenameOpen(false)}
                onSubmit={actions.handleRenameSubmit}
                value={modals.renameValue}
                setValue={modals.setRenameValue}
            />
            <DeleteModal
                isOpen={modals.isDeleteOpen}
                onClose={() => modals.setIsDeleteOpen(false)}
                onConfirm={actions.handleDeleteConfirm}
            />
            <ExportModal
                isOpen={modals.isExportOpen}
                onClose={() => modals.setIsExportOpen(false)}
                onConfirm={actions.handleExportConfirm}
                folderName={modals.exportTargetName}
            />
        </>
    );
});

export default Sidebar;