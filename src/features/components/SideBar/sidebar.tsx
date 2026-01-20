import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import "./sidebar.css";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import {
    getAllDirectories,
    type DirectoryDTO,
    createDirectory,
    deleteDirectory
} from "../../services/directories/directoryService";
import type {TreeNode, FlatItem} from "./SideBarPart/sidebarTypes";
import { SidebarHeader } from "./SideBarPart/SidebarHeader";
import { SidebarTree } from "./SideBarPart/SidebarTree";
import { CreateFolderModal, RenameModal, DeleteModal } from "./SideBarPart/SidebarModals";


// --- TYPES EXPORTÉS ---
// C'est ce type que la HomePage va utiliser pour typer la "ref"
export interface SidebarHandle {
    openCreateModal: () => void;
}

// --- HELPERS LOGIQUES ---
const getDescendantIds = (node: TreeNode, ids: string[] = []) => {
    if (node.children) {
        node.children.forEach((child) => {
            ids.push(child.id);
            getDescendantIds(child, ids);
        });
    }
    return ids;
};

const buildTree = (directories: DirectoryDTO[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialisation
    directories.forEach(dir => {
        map.set(String(dir.id), { id: String(dir.id), name: dir.name, children: [] });
    });

    // Reconstruction
    directories.forEach(dir => {
        const node = map.get(String(dir.id));
        if (!node) return;
        if (dir.parentDirectoryId !== null && map.has(String(dir.parentDirectoryId))) {
            map.get(String(dir.parentDirectoryId))!.children!.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
};

const updateNodeName = (nodes: TreeNode[], id: string, newName: string): TreeNode[] => {
    return nodes.map(node => {
        if (node.id === id) return { ...node, name: newName };
        if (node.children) return { ...node, children: updateNodeName(node.children, id, newName) };
        return node;
    });
};


const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 460;
const SIDEBAR_COLLAPSED_WIDTH = 72;

// --- COMPOSANT WRAPPÉ DANS FORWARDREF ---
// @ts-expect-error
const Sidebar = forwardRef<SidebarHandle>((props: object, ref) => {
    // --- STATE DONNEES ---
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // --- STATE UI ---
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(280);
    const [search, setSearch] = useState<string>("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeId, setActiveId] = useState<string>("");

    // --- STATE MODALES ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [targetParentId, setTargetParentId] = useState<string>("root");

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState("");

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [actionItemId, setActionItemId] = useState<string | null>(null);

    // --- CONTEXT MENU ---
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null }>({ x: 0, y: 0, targetId: null });

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);

    // --- EXPOSITION AU PARENT ---
    // C'est ici que la magie opère : on expose la fonction openCreateModal vers l'extérieur
    useImperativeHandle(ref, () => ({
        openCreateModal: () => {
            // On appelle la fonction interne d'ouverture (à la racine par défaut)
            openCreateModal(null);
        }
    }));

    // --- CHARGEMENT ---
    const refreshTree = async () => {
        try {
            const dirs = await getAllDirectories();
            setTreeData(buildTree(dirs));
        } catch (e) {
            console.error("Erreur chargement grimoire", e);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        refreshTree().finally(() => setIsLoading(false));
    }, []);

    // --- MEMOIZATION & LOGIQUE ARBRE ---
    const { parentById, allNodes } = useMemo(() => {
        const parent = new Map<string, string | null>();
        const nodes: TreeNode[] = [];
        const stack: Array<{ node: TreeNode; parent: string | null }> = [];

        for (let i = treeData.length - 1; i >= 0; i--) {
            stack.push({ node: treeData[i], parent: null });
        }

        while (stack.length) {
            const popped = stack.pop();
            if (popped) {
                const { node, parent: p } = popped;
                parent.set(node.id, p);
                nodes.push(node);
                if (node.children) {
                    for (let i = node.children.length - 1; i >= 0; i--) {
                        stack.push({ node: node.children[i], parent: node.id });
                    }
                }
            }
        }
        return { parentById: parent, allNodes: nodes };
    }, [treeData]);

    const matchSet = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return null;
        const set = new Set<string>();
        for (const node of allNodes) {
            if (node.name.toLowerCase().includes(q)) {
                set.add(node.id);
                let cur = node.id;
                while (true) {
                    const p = parentById.get(cur);
                    if (!p) break;
                    set.add(p);
                    cur = p;
                }
            }
        }
        return set;
    }, [search, allNodes, parentById]);

    const visibleItems: FlatItem[] = useMemo(() => {
        const list: FlatItem[] = [];
        const stack: Array<{ node: TreeNode; depth: number }> = [];
        for (let i = treeData.length - 1; i >= 0; i--) {
            stack.push({ node: treeData[i], depth: 0 });
        }
        while (stack.length) {
            const popped = stack.pop();
            if (popped) {
                const { node, depth } = popped;
                const matches = !matchSet || matchSet.has(node.id);

                if (matches) {
                    list.push({
                        id: node.id,
                        name: node.name,
                        depth,
                        hasChildren: !!(node.children && node.children.length > 0)
                    });
                }

                const isOpen = matchSet ? matchSet.has(node.id) : expanded[node.id];
                if (node.children && node.children.length > 0 && isOpen) {
                    for (let i = node.children.length - 1; i >= 0; i--) {
                        stack.push({ node: node.children[i], depth: depth + 1 });
                    }
                }
            }
        }
        return list;
    }, [expanded, matchSet, treeData]);

    // --- HANDLERS ACTIONS ---
    const toggleCollapse = () => setIsCollapsed(s => !s);

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const isClosing = prev[id];
            const newState = { ...prev, [id]: !prev[id] };
            if (isClosing) {
                const node = allNodes.find(n => n.id === id);
                if (node) {
                    getDescendantIds(node).forEach(childId => newState[childId] = false);
                }
            }
            return newState;
        });
    };

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id });
    };

    // --- HANDLERS MODALES ---
    const openCreateModal = (parentId: string | null) => {
        setNewFolderName("");
        setTargetParentId(parentId || "root");
        setIsCreateOpen(true);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            const payloadId = targetParentId === "root" ? null : Number(targetParentId);
            await createDirectory({ name: newFolderName, parentDirectoryId: payloadId });
            await refreshTree();
            if (payloadId !== null) {
                setExpanded(prev => ({ ...prev, [String(payloadId)]: true }));
            }
            setIsCreateOpen(false);
        } catch (error) {
            alert("Erreur lors de l'invocation du dossier !");
            console.error(error);
        }
    };

    const openRename = (id: string) => {
        const node = allNodes.find(n => n.id === id);
        setActionItemId(id);
        setRenameValue(node?.name || "");
        setIsRenameOpen(true);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const submitRename = (e: React.FormEvent) => {
        e.preventDefault();
        if (actionItemId && renameValue.trim()) {
            setTreeData(prev => updateNodeName(prev, actionItemId, renameValue));
            // TODO: Appel API
            setIsRenameOpen(false);
            setActionItemId(null);
        }
    };

    const openDelete = (id: string) => {
        setActionItemId(id);
        setIsDeleteOpen(true);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const submitDelete = async () => {
        try {
            let id;
            if (actionItemId != null) {
                id = parseInt(actionItemId)
            }
            // @ts-expect-error
            await deleteDirectory(id);
        }catch (e) {
            console.error(e);
        }finally {
            setIsDeleteOpen(false);
            refreshTree();
        }

    };

    // --- GESTION RESIZE ---
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
                style={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth }}
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="collapse-btn"
                    onClick={toggleCollapse}
                >
                    <span className={`chevron ${isCollapsed ? "right" : "left"}`} />
                </motion.button>

                <div className="sidebar-content">
                    {/* Header: Recherche + Bouton Nouveau */}
                    <SidebarHeader
                        search={search}
                        setSearch={setSearch}
                        isCollapsed={isCollapsed}
                        onOpenCreate={() => openCreateModal(null)}
                    />

                    {/* Arbre des fichiers */}
                    <SidebarTree
                        isLoading={isLoading}
                        visibleItems={visibleItems}
                        expanded={expanded}
                        matchSet={matchSet}
                        activeId={activeId}
                        isCollapsed={isCollapsed}
                        onToggleExpand={toggleExpand}
                        onSelect={setActiveId}
                        onContextMenu={handleContextMenu}
                    />
                </div>

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

            {/* Menu Clic Droit */}
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                targetId={contextMenu.targetId}
                onClose={() => setContextMenu(p => ({ ...p, targetId: null }))}
                onRename={openRename}
                onDelete={openDelete}
                // @ts-ignore
                onNewFolder={openCreateModal}
            />

            {/* Les Modales */}
            <CreateFolderModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateSubmit}
                folderName={newFolderName}
                setFolderName={setNewFolderName}
                parentId={targetParentId}
                setParentId={setTargetParentId}
                treeData={treeData}
            />

            <RenameModal
                isOpen={isRenameOpen}
                onClose={() => setIsRenameOpen(false)}
                onSubmit={submitRename}
                value={renameValue}
                setValue={setRenameValue}
            />

            <DeleteModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={submitDelete}
            />
        </>
    );
});

export default Sidebar;