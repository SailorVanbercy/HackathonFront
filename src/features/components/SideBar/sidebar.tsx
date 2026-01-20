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

// --- HOOKS (Le Cerveau) ---
import { useSidebarTree } from "./hooks/useSidebarTree";
import { useSidebarModals } from "./hooks/useSidebarModals";
import { useSidebarActions } from "./hooks/useSidebarActions";

// Interface exposée au composant parent (HomePage)
export interface SidebarHandle {
    openCreateModal: () => void;
    openExportModal: () => void;
}

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 460;
const SIDEBAR_COLLAPSED_WIDTH = 0;

// --- COMPOSANT PRINCIPAL ---
const Sidebar = forwardRef<SidebarHandle, object>((_, ref) => {

    // 1. Initialisation des Hooks
    const tree = useSidebarTree(); // Gestion de l'arbre, recherche, expansion
    const modals = useSidebarModals(); // Gestion de l'état des fenêtres modales

    // Actions : fait le pont entre les modales et le rafraîchissement de l'arbre
    const actions = useSidebarActions({
        refreshTree: tree.refreshTree,
        modals,
        setExpanded: tree.setExpanded
    });

    // 2. State UI local (Purement visuel)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(280);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null }>({ x: 0, y: 0, targetId: null });

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);

    // 3. Handlers UI (Interactions locales)
    const toggleCollapse = () => setIsCollapsed(s => !s);

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id });
    };

    // Fonctions intermédiaires pour préparer les données avant d'ouvrir les modales
    const handleOpenRename = (id: string) => {
        const node = tree.allNodes.find(n => n.id === id);
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
        // On récupère le nom pour l'afficher joliment dans la modale
        const node = id ? tree.allNodes.find(n => n.id === id) : null;
        modals.openExportModal(id, node?.name);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const handleOpenCreate = (parentId: string | null) => {
        modals.openCreateModal(parentId);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    // 4. Exposition des méthodes au parent via ref
    useImperativeHandle(ref, () => ({
        openCreateModal: () => modals.openCreateModal(null),
        openExportModal: () => modals.openExportModal(null)
    }));

    // 5. Gestion du redimensionnement (Resize)
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

    // 6. Rendu
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
                            onOpenCreate={() => modals.openCreateModal(null)}
                        />

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
                // @ts-expect-error - legacy prop type check handling
                onNewFolder={handleOpenCreate}
            />

            {/* Modales - Pilotées par le Hook modals et actions */}
            <CreateFolderModal
                isOpen={modals.isCreateOpen}
                onClose={() => modals.setIsCreateOpen(false)}
                onSubmit={actions.handleCreateSubmit}
                folderName={modals.newFolderName}
                setFolderName={modals.setNewFolderName}
                parentId={modals.targetParentId}
                setParentId={modals.setTargetParentId}
                treeData={tree.treeData}
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