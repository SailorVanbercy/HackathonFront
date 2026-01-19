import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GiSpellBook, GiScrollUnfurled, GiSpiderWeb, GiFiles } from "react-icons/gi";
import "./Sidebar.css";
import { ContextMenu } from "./ContextMenu";

// --- Types ---
type TreeNode = {
    id: string;
    name: string;
    children?: TreeNode[];
};

// Données initiales
const initialData: TreeNode[] = [
    {
        id: "proj-halloween",
        name: "Projet Halloween",
        children: [
            { id: "todo", name: "À faire" },
            { id: "icones", name: "Idées d’icônes" },
            {
                id: "assets",
                name: "Ressources",
                children: [
                    { id: "fonts", name: "Polices" },
                    { id: "images", name: "Images" },
                ],
            },
        ],
    },
    { id: "cours-amt", name: "Cours AMT" },
    { id: "notes-rapides", name: "Incantations rapides" },
];

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 460;
const SIDEBAR_COLLAPSED_WIDTH = 72;

type FlatItem = {
    id: string;
    name: string;
    depth: number;
    hasChildren: boolean;
};

const Sidebar = () => {
    // --- State Données ---
    const [treeData, setTreeData] = useState<TreeNode[]>(initialData);

    // --- UI State ---
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(280);
    const [search, setSearch] = useState<string>("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ "proj-halloween": true });
    const [activeId, setActiveId] = useState<string>("");

    // --- Context Menu State ---
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null }>({
        x: 0, y: 0, targetId: null
    });

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);

    // --- Helpers Icônes ---
    const getIcon = (hasChildren: boolean, isOpen: boolean) => {
        if (hasChildren) {
            return isOpen ? <GiSpellBook className="icon-glow" /> : <GiFiles />;
        }
        return <GiScrollUnfurled />;
    };

    // --- Logic Arborescence ---

    // CORRECTION TS7022: On ajoute le type de retour explicite pour useMemo
    const { parentById, allNodes } = useMemo<{ parentById: Map<string, string | null>; allNodes: TreeNode[] }>(() => {
        const parent = new Map<string, string | null>();
        const nodes: TreeNode[] = [];
        // Stack typée correctement
        const stack: Array<{ node: TreeNode; parent: string | null }> = [];

        for (let i = treeData.length - 1; i >= 0; i--) {
            stack.push({ node: treeData[i], parent: null });
        }
        while (stack.length) {
            const popped = stack.pop();
            if(popped) {
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
            if(popped) {
                const { node, depth } = popped;
                const hasChildren = !!node.children?.length;
                const allowed = !matchSet || matchSet.has(node.id);
                if (allowed) {
                    list.push({ id: node.id, name: node.name, depth, hasChildren });
                }
                const isOpen = matchSet ? !!matchSet.has(node.id) : !!expanded[node.id];
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
    const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    const handleSelect = (id: string) => setActiveId(id);

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, targetId: id });
    };

    // CORRECTION TS6133: On utilise setTreeData avec des fonctions récursives

    // Fonction récursive pour renommer
    const updateNodeName = (nodes: TreeNode[], id: string, newName: string): TreeNode[] => {
        return nodes.map(node => {
            if (node.id === id) {
                return { ...node, name: newName };
            }
            if (node.children) {
                return { ...node, children: updateNodeName(node.children, id, newName) };
            }
            return node;
        });
    };

    // Fonction récursive pour supprimer
    const removeNode = (nodes: TreeNode[], id: string): TreeNode[] => {
        return nodes
            .filter(node => node.id !== id)
            .map(node => {
                if (node.children) {
                    return { ...node, children: removeNode(node.children, id) };
                }
                return node;
            });
    };

    const handleRename = (id: string) => {
        const newName = prompt("Nouveau nom sinistre :");
        if (newName) {
            setTreeData(prev => updateNodeName(prev, id, newName));
        }
        setContextMenu({ ...contextMenu, targetId: null });
    };

    const handleDelete = (id: string) => {
        if(confirm("Voulez-vous vraiment bannir cette note vers les limbes ?")) {
            setTreeData(prev => removeNode(prev, id));
        }
        setContextMenu({ ...contextMenu, targetId: null });
    };

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
                    <div className="sidebar-top">
                        <div className="search-wrap">
                            <span className="search-ico"><GiSpiderWeb /></span>
                            <input
                                type="text"
                                className="sidebar-search"
                                placeholder="Rechercher un sort..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="tree">
                        {visibleItems.map((item) => {
                            const isOpen = (matchSet ? !!matchSet.has(item.id) : !!expanded[item.id]);
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
                                        <button
                                            className={`disclosure ${isOpen ? "open" : ""}`}
                                            onClick={() => toggleExpand(item.id)}
                                        >
                                            <span className="chev" />
                                        </button>
                                    ) : (
                                        <span className="disclosure placeholder" />
                                    )}

                                    <button
                                        className={`tree-item ${isActive ? "active" : ""}`}
                                        onClick={() => handleSelect(item.id)}
                                    >
                                        <span className="icon">
                                            {getIcon(item.hasChildren, isOpen && item.hasChildren)}
                                        </span>
                                        {!isCollapsed && <span className="label">{item.name}</span>}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {!isCollapsed && <div className="resize-handle" onMouseDown={startResize} />}
            </aside>

            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                targetId={contextMenu.targetId}
                onClose={() => setContextMenu({ ...contextMenu, targetId: null })}
                onRename={handleRename}
                onDelete={handleDelete}
            />
        </>
    );
};

export default Sidebar;