import React from "react";
import { motion } from "framer-motion";
import { GiSpellBook, GiFiles, GiScrollUnfurled, GiFeather } from "react-icons/gi";
import type { FlatItem } from "./sidebarTypes";
import { useNavigate } from "react-router";

interface SidebarTreeProps {
    isLoading: boolean;
    visibleItems: FlatItem[];
    expanded: Record<string, boolean>;
    matchSet: Set<string> | null;
    activeId: string;
    isCollapsed: boolean;
    onToggleExpand: (id: string) => void;
    onSelect: (id: string) => void;
    // On ajoute le type ici pour savoir sur quoi on clique droit
    onContextMenu: (e: React.MouseEvent, id: string, type: 'directory' | 'note') => void;
}

const getIcon = (type: 'directory' | 'note', hasChildren: boolean, isOpen: boolean) => {
    if (type === 'note') {
        return <GiFeather className="icon-note" />;
    }
    // Logique dossier existante
    if (hasChildren) {
        return isOpen ? <GiSpellBook className="icon-glow" /> : <GiFiles />;
    }
    return <GiScrollUnfurled />;
};

export const SidebarTree: React.FC<SidebarTreeProps> = ({
                                                            isLoading, visibleItems, expanded, matchSet, activeId, isCollapsed,
                                                            onToggleExpand, onSelect, onContextMenu
                                                        }) => {
    const navigate = useNavigate();

    const handleClick = (item: FlatItem) => {
        onSelect(item.id);

        if (item.type === 'directory') {
            // Comportement dossier : on ouvre/ferme
            if (item.hasChildren) {
                onToggleExpand(item.id);
            }
        } else {
            // Comportement note : on navigue
            // L'ID dans l'arbre est "note-12", on veut juste "12" pour l'URL
            const realId = item.id.replace('note-', '');
            navigate(`/notes/${realId}`);
        }
    };

    return (
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
                    const isOpen = matchSet ? matchSet.has(item.id) : expanded[item.id];
                    const isActive = activeId === item.id;

                    return (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="tree-row"
                            style={{ paddingLeft: isCollapsed ? 8 : 8 + item.depth * 14 }}
                            onContextMenu={(e) => onContextMenu(e, item.id, item.type)}
                        >
                            {/* Flèche uniquement pour les dossiers avec enfants */}
                            {item.type === 'directory' && item.hasChildren ? (
                                <button
                                    className={`disclosure ${isOpen ? "open" : ""}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleExpand(item.id);
                                    }}
                                >
                                    <span className="chev" />
                                </button>
                            ) : (
                                <span className="disclosure placeholder" />
                            )}

                            <button
                                className={`tree-item ${isActive ? "active" : ""} ${item.type}`}
                                onClick={() => handleClick(item)}
                            >
                                <span className="icon">
                                    {getIcon(item.type, item.hasChildren, isOpen && item.hasChildren)}
                                </span>
                                {!isCollapsed && <span className="label">{item.name}</span>}
                            </button>
                        </motion.div>
                    );
                })
            )}
        </div>
    );
};