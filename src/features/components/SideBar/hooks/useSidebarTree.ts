import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllDirectories, type DirectoryDTO } from "../../../services/directories/directoryService";
import type {TreeNode, FlatItem} from "../SideBarPart/sidebarTypes";

// --- HELPERS PURS (Peuvent rester hors du hook) ---
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

const getDescendantIds = (node: TreeNode, ids: string[] = []) => {
    if (node.children) {
        node.children.forEach((child) => {
            ids.push(child.id);
            getDescendantIds(child, ids);
        });
    }
    return ids;
};

export const useSidebarTree = () => {
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeId, setActiveId] = useState<string>("");

    // --- CHARGEMENT ---
    const refreshTree = useCallback(async () => {
        try {
            const dirs = await getAllDirectories();
            setTreeData(buildTree(dirs));
        } catch (e) {
            console.error("Erreur chargement grimoire", e);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        refreshTree().finally(() => setIsLoading(false));
    }, [refreshTree]);

    // --- MEMOIZATION & CALCULS ---
    // Calcul des parents et liste à plat de tous les noeuds
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

    // Gestion de la recherche (Filtrage)
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

    // Liste finale à afficher (Flat list pour le rendu virtuel si besoin)
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
                // Si pas de recherche OU si le noeud est dans les résultats
                if (!matchSet || matchSet.has(node.id)) {
                    list.push({ id: node.id, name: node.name, depth, hasChildren: !!node.children?.length });
                }

                // Logique d'expansion : ouvert si recherche active OU si state expanded est true
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

    // --- ACTIONS UI ---
    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const isClosing = prev[id];
            const newState = { ...prev, [id]: !prev[id] };
            // Si on ferme, on ferme aussi récursivement les enfants pour nettoyer l'état visuel
            if (isClosing) {
                const node = allNodes.find(n => n.id === id);
                if (node) {
                    getDescendantIds(node).forEach(childId => newState[childId] = false);
                }
            }
            return newState;
        });
    };

    return {
        treeData,
        allNodes, // Utile pour retrouver les noms par ID
        isLoading,
        search,
        setSearch,
        expanded,
        setExpanded, // On l'expose au cas où
        toggleExpand,
        activeId,
        setActiveId,
        visibleItems,
        matchSet,
        refreshTree
    };
};