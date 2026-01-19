
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./HomePage.css";

interface HomePageProps {
    user: string;
    onCreateFolder: () => void;
    onOpenRecent: () => void;
}

type TreeNode = {
    id: string;
    name: string;
    icon?: React.ReactNode;
    children?: TreeNode[];
};

/** Données d'exemple (remplace par tes vraies données) */
const initialTree: TreeNode[] = [
    {
        id: "proj-halloween",
        name: "Projet Halloween",
        icon: "📁",
        children: [
            { id: "todo", name: "À faire", icon: "📄" },
            { id: "icones", name: "Idées d’icônes", icon: "📄" },
            {
                id: "assets",
                name: "Assets",
                icon: "📁",
                children: [
                    { id: "fonts", name: "Fonts", icon: "📄" },
                    { id: "images", name: "Images", icon: "📄" },
                ],
            },
        ],
    },
    { id: "cours-amt", name: "Cours AMT", icon: "📁" },
    { id: "notes-rapides", name: "Notes rapides", icon: "📄" },
];

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 460;
const SIDEBAR_COLLAPSED_WIDTH = 72;

type FlatItem = {
    id: string;
    name: string;
    icon?: React.ReactNode;
    depth: number;
    hasChildren: boolean;
};

const HomePage: React.FC<HomePageProps> = ({ user, onCreateFolder, onOpenRecent }) => {
    // --- UI State ---
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        try {
            const v = localStorage.getItem("sidebarCollapsed");
            return v ? JSON.parse(v) : false;
        } catch {
            return false;
        }
    });
    const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
        try {
            const v = localStorage.getItem("sidebarWidth");
            return v ? Number(v) : 280;
        } catch {
            return 280;
        }
    });
    const [search, setSearch] = useState<string>("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        "proj-halloween": true,
    });
    const [activeId, setActiveId] = useState<string>("");

    // --- Refs pour redimensionnement ---
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const resizingRef = useRef<boolean>(false);

    // --- Persistance ---
    useEffect(() => {
        try {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
        } catch { /* empty */ }
    }, [isCollapsed]);

    useEffect(() => {
        try {
            localStorage.setItem("sidebarWidth", String(sidebarWidth));
        } catch { /* empty */ }
    }, [sidebarWidth]);

    // --- Map parent -> enfant (et liste de tous les nœuds) : itératif, non récursif ---
    const { parentById, allNodes } = useMemo(() => {
        const parent = new Map<string, string | null>();
        const nodes: TreeNode[] = [];
        // pile pour parcours
        const stack: Array<{ node: TreeNode; parent: string | null }> = [];
        for (let i = initialTree.length - 1; i >= 0; i--) {
            stack.push({ node: initialTree[i], parent: null });
        }
        while (stack.length) {
            const { node, parent: p } = stack.pop()!;
            parent.set(node.id, p);
            nodes.push(node);
            if (node.children) {
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push({ node: node.children[i], parent: node.id });
                }
            }
        }
        return { parentById: parent, allNodes: nodes };
    }, []);

    // --- IDs autorisés par le filtre (match + ancêtres), itératif ---
    const matchSet = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return null as Set<string> | null;
        const set = new Set<string>();
        for (const node of allNodes) {
            if (node.name.toLowerCase().includes(q)) {
                set.add(node.id);
                // ajoute tous ses ancêtres
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

    // --- Construction de la liste visible (plate), itératif ---
    const visibleItems: FlatItem[] = useMemo(() => {
        const list: FlatItem[] = [];
        const stack: Array<{ node: TreeNode; depth: number }> = [];
        for (let i = initialTree.length - 1; i >= 0; i--) {
            stack.push({ node: initialTree[i], depth: 0 });
        }
        while (stack.length) {
            const { node, depth } = stack.pop()!;
            const hasChildren = !!node.children?.length;
            // autorisé par le filtre ?
            const allowed = !matchSet || matchSet.has(node.id);
            if (allowed) {
                list.push({
                    id: node.id,
                    name: node.name,
                    icon: node.icon,
                    depth,
                    hasChildren,
                });
            }
            // doit-on parcourir les enfants ?
            // - si filtre actif : on "considère ouvert" tout nœud présent dans matchSet (ancêtres inclus)
            // - sinon : selon expanded
            const isOpen = matchSet ? !!matchSet.has(node.id) : !!expanded[node.id];
            if (hasChildren && isOpen) {
                const kids = node.children!;
                for (let i = kids.length - 1; i >= 0; i--) {
                    stack.push({ node: kids[i], depth: depth + 1 });
                }
            }
        }
        return list;
    }, [expanded, matchSet]);

    // --- Handlers ---
    const toggleCollapse = () => setIsCollapsed((s) => !s);
    const toggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };
    const handleSelect = (id: string) => {
        setActiveId(id);
        // TODO: naviguer / charger la note sélectionnée
    };

    const startResize = (e: React.MouseEvent) => {
        e.preventDefault();
        resizingRef.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current || !sidebarRef.current) return;
            const rect = sidebarRef.current.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            // clamp
            const w = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, newWidth));
            setSidebarWidth(w);
            if (isCollapsed) setIsCollapsed(false);
        };
        const onMouseUp = () => {
            resizingRef.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [isCollapsed]);

    const handleKeyNav = (e: React.KeyboardEvent, item: FlatItem) => {
        // ← replie, → déplie
        if (e.key === "ArrowRight" && item.hasChildren) {
            setExpanded((prev) => ({ ...prev, [item.id]: true }));
        } else if (e.key === "ArrowLeft" && item.hasChildren) {
            setExpanded((prev) => ({ ...prev, [item.id]: false }));
        }
    };

    return (
        <div className="home-root">
            {/* ----- Titre fixe en haut, centré horizontalement ----- */}
            <div className="hero-center" aria-hidden="true">
                <h1 className="home-title">
                    🎃 Bienvenue {user} sur <span className="grimoire">The Lost Grimoire</span>
                </h1>
            </div>

            {/* ----- Sidebar ----- */}
            <aside
                ref={sidebarRef}
                className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
                aria-label="Barre latérale"
                style={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth }}
            >
                {/* Bouton rétracter/déployer */}
                <button
                    className="collapse-btn"
                    type="button"
                    onClick={toggleCollapse}
                    aria-expanded={!isCollapsed}
                    aria-controls="sidebar-content"
                    title={isCollapsed ? "Ouvrir la barre latérale" : "Réduire la barre latérale"}
                >
          <span className="sr-only">
            {isCollapsed ? "Ouvrir la barre latérale" : "Réduire la barre latérale"}
          </span>
                    <span className={`chevron ${isCollapsed ? "right" : "left"}`} />
                </button>

                <div id="sidebar-content" className="sidebar-content">
                    {/* Recherche */}
                    <div className="sidebar-top">
                        <div className="search-wrap">
                            <span className="search-ico">🔎</span>
                            <input
                                type="text"
                                className="sidebar-search"
                                placeholder="Rechercher…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Arborescence (liste plate, non récursive) */}
                    <div className="tree" role="tree" aria-label="Arborescence dossiers et notes">
                        {visibleItems.map((item) => {
                            const open =
                                (matchSet ? !!matchSet.has(item.id) : !!expanded[item.id]) && item.hasChildren;
                            const isActive = activeId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className="tree-row"
                                    style={{ paddingLeft: isCollapsed ? 8 : 8 + item.depth * 14 }}
                                >
                                    {item.hasChildren ? (
                                        <button
                                            type="button"
                                            className={`disclosure ${open ? "open" : ""}`}
                                            onClick={() => toggleExpand(item.id)}
                                            aria-label={open ? "Réduire le dossier" : "Développer le dossier"}
                                            title={isCollapsed ? item.name : undefined}
                                        >
                                            <span className="chev" />
                                        </button>
                                    ) : (
                                        <span className="disclosure placeholder" />
                                    )}

                                    <button
                                        type="button"
                                        className={`tree-item ${isActive ? "active" : ""}`}
                                        onClick={() => handleSelect(item.id)}
                                        onKeyDown={(e) => handleKeyNav(e, item)}
                                        title={isCollapsed ? item.name : undefined}
                                    >
                    <span className="icon" aria-hidden="true">
                      {item.icon ?? (item.hasChildren ? "📁" : "📄")}
                    </span>
                                        {!isCollapsed && <span className="label">{item.name}</span>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Poignée de redimensionnement */}
                {!isCollapsed && (
                    <div
                        className="resize-handle"
                        onMouseDown={startResize}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Redimensionner la barre latérale"
                        title="Glisser pour redimensionner"
                    />
                )}
            </aside>

            {/* ----- Zone principale ----- */}
            <main className="main-area">
                {/* Version accessible (l’overlay est aria-hidden) */}
                <h1 className="sr-only">Bienvenue {user} sur The Lost Grimoire</h1>

                {/* Actions principales (déplacées depuis la barre latérale) */}
                <div className="main-actions" role="group" aria-label="Actions principales">
                    <button className="halloween-btn" onClick={onCreateFolder}>
                        📁 Créer un dossier
                    </button>
                    <button className="halloween-btn" onClick={onOpenRecent}>
                        🗂️ Ouvrir dossier récent
                    </button>
                </div>


            </main>
        </div>
    );
};

export default HomePage;

