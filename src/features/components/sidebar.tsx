import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiSpellBook, GiScrollUnfurled, GiSpiderWeb, GiFiles, GiHealthNormal } from "react-icons/gi";
import "./Sidebar.css";
import { ContextMenu } from "./ContextMenu";
import { getAllDirectories, type DirectoryDTO, createDirectory } from "../services/directories/directoryService.ts";

// --- Types ---
type TreeNode = {
    id: string;
    name: string;
    children?: TreeNode[];
};

type FlatItem = {
    id: string;
    name: string;
    depth: number;
    hasChildren: boolean;
};

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 460;
const SIDEBAR_COLLAPSED_WIDTH = 72;

// --- Helpers ---

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

    // 1. Transformation
    directories.forEach(dir => {
        map.set(String(dir.id), {
            id: String(dir.id),
            name: dir.name,
            children: []
        });
    });

    // 2. Reconstruction
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

const Sidebar = () => {
    // --- State Données ---
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // --- UI State ---
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(280);
    const [search, setSearch] = useState<string>("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeId, setActiveId] = useState<string>("");

    // --- Modal State (Pour la création de dossier) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [targetParentId, setTargetParentId] = useState<string>("root"); // "root" = null pour le back

    // --- Context Menu State ---
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null }>({
        x: 0, y: 0, targetId: null
    });

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);

    // Fonction pour charger/recharger l'arbre
    const refreshTree = async () => {
        try {
            const dirs = await getAllDirectories();
            const tree = buildTree(dirs);
            setTreeData(tree);
        } catch (e) {
            console.error("Impossible de charger le grimoire", e);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        refreshTree().finally(() => setIsLoading(false));
    }, []);

    // --- Helpers Icônes ---
    const getIcon = (hasChildren: boolean, isOpen: boolean) => {
        if (hasChildren) {
            return isOpen ? <GiSpellBook className="icon-glow" /> : <GiFiles />;
        }
        return <GiScrollUnfurled />;
    };

    // --- Logic Arborescence (Memoized) ---
    const { parentById, allNodes } = useMemo<{ parentById: Map<string, string | null>; allNodes: TreeNode[] }>(() => {
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
                const hasChildren = !!node.children?.length;
                const allowed = !matchSet || matchSet.has(node.id);
                if (allowed) {
                    list.push({ id: node.id, name: node.name, depth, hasChildren });
                }
                const isOpen = matchSet ? matchSet.has(node.id) : expanded[node.id];
                if (hasChildren && isOpen) {
                    const kids = node.children!;
                    for (let i = kids.length - 1; i >= 0; i--) {
                        stack.push({ node: kids[i], depth: depth + 1 });
                    }
                }
            }
        }
        return list;
    }, [expanded, matchSet, treeData]);

    // --- Handlers ---
    const toggleCollapse = () => setIsCollapsed((s) => !s);
    const handleSelect = (id: string) => setActiveId(id);

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const isClosing = prev[id];
            const newState = { ...prev, [id]: !prev[id] };

            if (isClosing) {
                const node = allNodes.find((n) => n.id === id);
                if (node) {
                    const descendants = getDescendantIds(node);
                    descendants.forEach((childId) => {
                        newState[childId] = false;
                    });
                }
            }
            return newState;
        });
    };

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id });
    };

    // --- Modal Logic ---

    // Ouvre la modale en pré-sélectionnant le parent (racine ou dossier spécifique)
    const openCreateModal = (parentId: string | null) => {
        setNewFolderName("");
        setTargetParentId(parentId || "root");
        setIsModalOpen(true);
        setContextMenu({ ...contextMenu, targetId: null }); // Ferme le menu contextuel
    };

    // Soumission du formulaire de création
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            // "root" devient null pour le backend
            const payloadId = targetParentId === "root" ? null : Number(targetParentId);

            await createDirectory({
                name: newFolderName,
                parentDirectoryId: payloadId
            });

            await refreshTree();

            // Si on a créé dans un dossier, on l'ouvre
            if (payloadId !== null) {
                setExpanded(prev => ({ ...prev, [String(payloadId)]: true }));
            }
            setIsModalOpen(false);
        } catch (error) {
            alert("Erreur lors de l'invocation du dossier !");
            console.error(error);
        }
    };

    // Helper pour afficher les options indentées dans le Select
    const renderDirectoryOptions = (nodes: TreeNode[], depth = 0): React.ReactNode[] => {
        return nodes.flatMap(node => [
            <option key={node.id} value={node.id}>
                {"\u00A0".repeat(depth * 3) + (depth > 0 ? "└ " : "") + node.name}
            </option>,
            ...(node.children ? renderDirectoryOptions(node.children, depth + 1) : [])
        ]);
    };

    // --- Other CRUD ---
    const updateNodeName = (nodes: TreeNode[], id: string, newName: string): TreeNode[] => {
        return nodes.map(node => {
            if (node.id === id) return { ...node, name: newName };
            if (node.children) return { ...node, children: updateNodeName(node.children, id, newName) };
            return node;
        });
    };

    const removeNode = (nodes: TreeNode[], id: string): TreeNode[] => {
        return nodes.filter(node => node.id !== id).map(node => {
            if (node.children) return { ...node, children: removeNode(node.children, id) };
            return node;
        });
    };

    const handleRename = (id: string) => {
        const newName = prompt("Nouveau nom sinistre :");
        if (newName) setTreeData(prev => updateNodeName(prev, id, newName));
        setContextMenu({ ...contextMenu, targetId: null });
    };

    const handleDelete = (id: string) => {
        if (confirm("Voulez-vous vraiment bannir cette note vers les limbes ?")) {
            setTreeData(prev => removeNode(prev, id));
        }
        setContextMenu({ ...contextMenu, targetId: null });
    };

    // --- Resize ---
    const startResize = (e: React.MouseEvent) => {
        e.preventDefault(); resizingRef.current = true;
        document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!resizingRef.current || !sidebarRef.current) return;
            const newW = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, newW)));
        };
        const onUp = () => { resizingRef.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
        return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    }, []);

    const handleDoubleClick = (item: FlatItem) => {
        if (item.hasChildren) toggleExpand(item.id);
    };

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
                    <div className="sidebar-top" style={{ flexDirection: 'column', gap: '8px' }}>
                        <div className="search-wrap" style={{ width: '100%' }}>
                            <span className="search-ico"><GiSpiderWeb /></span>
                            <input
                                type="text"
                                className="sidebar-search"
                                placeholder="Rechercher..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {!isCollapsed && (
                            <button
                                onClick={() => openCreateModal(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    width: '100%', padding: '6px', background: '#330033',
                                    border: '1px solid #ff6600', color: '#ffcc99', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '0.9rem'
                                }}
                            >
                                <GiHealthNormal style={{ fontSize: '0.8rem' }} /> Nouveau Grimoire
                            </button>
                        )}
                    </div>

                    <div className="tree">
                        {isLoading ? (
                            <div style={{ color: "rgba(255,204,153,0.7)", padding: "20px", textAlign: "center", fontStyle: "italic" }}>
                                Invocation en cours...
                            </div>
                        ) : visibleItems.length === 0 ? (
                            <div style={{ color: "rgba(255,255,255,0.4)", padding: "20px", textAlign: "center" }}>
                                Aucun grimoire trouvé.
                            </div>
                        ) : (
                            visibleItems.map((item) => {
                                const isOpen = (matchSet ? matchSet.has(item.id) : expanded[item.id]);
                                const isActive = activeId === item.id;
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="tree-row"
                                        style={{ paddingLeft: isCollapsed ? 8 : 8 + item.depth * 14 }}
                                        onContextMenu={(e) => handleContextMenu(e, item.id)}
                                    >
                                        {item.hasChildren ? (
                                            <button className={`disclosure ${isOpen ? "open" : ""}`} onClick={() => toggleExpand(item.id)}>
                                                <span className="chev" />
                                            </button>
                                        ) : (
                                            <span className="disclosure placeholder" />
                                        )}
                                        <button
                                            className={`tree-item ${isActive ? "active" : ""}`}
                                            onClick={() => handleSelect(item.id)}
                                            onDoubleClick={() => handleDoubleClick(item)}
                                        >
                                            <span className="icon">{getIcon(item.hasChildren, isOpen && item.hasChildren)}</span>
                                            {!isCollapsed && <span className="label">{item.name}</span>}
                                        </button>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
                {!isCollapsed && <div className="resize-handle" onMouseDown={startResize} />}
            </aside>

            {/* Menu Contextuel */}
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                targetId={contextMenu.targetId}
                onClose={() => setContextMenu({ ...contextMenu, targetId: null })}
                onRename={handleRename}
                onDelete={handleDelete}
                // @ts-ignore
                onNewFolder={(id: string) => openCreateModal(id)}
            />

            {/* MODALE DE CRÉATION */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="modal-title">🔮 Invocation de Dossier</h3>

                            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="modal-field">
                                    <label>Nom du grimoire</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="modal-input"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Ex: Potions interdites..."
                                    />
                                </div>

                                <div className="modal-field">
                                    <label>Emplacement (Parent)</label>
                                    <select
                                        className="modal-select"
                                        value={targetParentId}
                                        onChange={(e) => setTargetParentId(e.target.value)}
                                    >
                                        <option value="root">✨ Racine (Aucun parent)</option>
                                        {renderDirectoryOptions(treeData)}
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
                                    <button type="submit" className="btn-confirm">Invoquer</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;