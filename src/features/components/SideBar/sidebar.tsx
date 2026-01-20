import React, {
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    forwardRef
} from "react";
import { motion } from "framer-motion";
import "./sidebar.css";
import { ContextMenu } from "../ContextMenu/ContextMenu";
// AJOUT : Import de updateDirectory
import {
    getAllDirectories,
    type DirectoryDTO,
    createDirectory,
    deleteDirectory,
    updateDirectory
} from "../../services/directories/directoryService";
import type { TreeNode, FlatItem } from "./SideBarPart/sidebarTypes";
import { SidebarHeader } from "./SideBarPart/SidebarHeader";
import { SidebarTree } from "./SideBarPart/SidebarTree";
import { CreateFolderModal, RenameModal, DeleteModal } from "./SideBarPart/SidebarModals";

export interface SidebarHandle {
    openCreateModal: () => void;
}

// --- HELPERS ---
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
    if (!directories) return [];
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    directories.forEach(dir => {
        map.set(String(dir.id), { id: String(dir.id), name: dir.name, children: [] });
    });

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
const SIDEBAR_COLLAPSED_WIDTH = 0;

// --- COMPOSANT ---
const Sidebar = forwardRef<SidebarHandle, object>((props, ref) => {
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

    // --- MEMOIZATION ---
    const { parentById, allNodes } = useMemo(() => {
        const parent = new Map<string, string | null>();
        const nodes: TreeNode[] = [];
        const stack: Array<{ node: TreeNode; parent: string | null }> = [];

        let loopSafety = 0;
        for (let i = treeData.length - 1; i >= 0; i--) {
            stack.push({ node: treeData[i], parent: null });
        }
        while (stack.length) {
            loopSafety++;
            if (loopSafety > 10000) break;

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
                let depth = 0;
                while (depth < 50) {
                    const p = parentById.get(cur);
                    if (!p) break;
                    set.add(p);
                    cur = p;
                    depth++;
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

        let loopSafety = 0;
        while (stack.length) {
            loopSafety++;
            if (loopSafety > 10000) break;

            const popped = stack.pop();
            if (popped) {
                const { node, depth } = popped;
                if (!matchSet || matchSet.has(node.id)) {
                    list.push({ id: node.id, name: node.name, depth, hasChildren: !!node.children?.length });
                }
                const isOpen = matchSet ? matchSet.has(node.id) : expanded[node.id];
                if (!!node.children?.length && isOpen) {
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

    // --- MODIFICATION ICI : Appel au nouveau service updateDirectory ---
    const submitRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (actionItemId && renameValue.trim()) {
            try {
                // Le backend attend { id, name }
                await updateDirectory({
                    id: parseInt(actionItemId),
                    name: renameValue
                });

                // On recharge l'arbre pour voir le changement
                await refreshTree();

                // On ferme la modale
                setIsRenameOpen(false);
                setActionItemId(null);
            } catch (error) {
                console.error("Erreur lors du renommage", error);
                alert("Impossible de renommer ce parchemin !");
            }
        }
    };

    const openDelete = (id: string) => {
        setActionItemId(id);
        setIsDeleteOpen(true);
        setContextMenu(p => ({ ...p, targetId: null }));
    };

    const submitDelete = async () => {
        try {
            if (actionItemId != null) {
                await deleteDirectory(parseInt(actionItemId));
            }
        } catch (e) {
            console.error(e);
            alert("Impossible de détruire ce dossier !");
        } finally {
            setIsDeleteOpen(false);
            await refreshTree();
        }
    };

    // --- EXPOSITION AU PARENT ---
    useImperativeHandle(ref, () => ({
        openCreateModal: () => {
            openCreateModal(null);
        }
    }));

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
                    style={{
                        position: 'absolute',
                        right: isCollapsed ? -40 : 10,
                        top: 10,
                        zIndex: 100,
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#2d2d2d',
                        border: '1px solid #444',
                        borderRadius: '50%',
                        cursor: 'pointer'
                    }}
                >
                    <span className={`chevron ${isCollapsed ? "right" : "left"}`} />
                </motion.button>

                {!isCollapsed && (
                    <div className="sidebar-content" style={{ overflow: 'hidden', height: '100%' }}>
                        <SidebarHeader
                            search={search}
                            setSearch={setSearch}
                            isCollapsed={isCollapsed}
                            onOpenCreate={() => openCreateModal(null)}
                        />

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

            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                targetId={contextMenu.targetId}
                onClose={() => setContextMenu(p => ({ ...p, targetId: null }))}
                onRename={openRename}
                onDelete={openDelete}
                // @ts-expect-error
                onNewFolder={openCreateModal}
            />

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