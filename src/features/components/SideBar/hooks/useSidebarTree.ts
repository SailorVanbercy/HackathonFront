import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllDirectories, type DirectoryDTO } from "../../../services/directories/directoryService";
import { getAllNotes, type NoteTreeItemDTO } from "../../../services/notes/noteService";
import type {TreeNode, FlatItem} from "../SideBarPart/sidebarTypes";

// --- BUILDER UNIFIÉ (Logique pure, hors du composant) ---
const buildTree = (directories: DirectoryDTO[], notes: NoteTreeItemDTO[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // 1. Création des noeuds "Dossiers"
    directories.forEach(dir => {
        const uniqueId = `dir-${dir.id}`;
        map.set(String(dir.id), {
            id: uniqueId,
            name: dir.name,
            type: 'directory',
            children: []
        });
    });

    // 2. Placement des "Notes"
    notes.forEach(note => {
        const uniqueId = `note-${note.id}`;
        const noteNode: TreeNode = {
            id: uniqueId,
            name: note.name,
            type: 'note',
            children: []
        };

        if (note.directoryId && map.has(String(note.directoryId))) {
            map.get(String(note.directoryId))!.children!.push(noteNode);
        } else {
            roots.push(noteNode);
        }
    });

    // 3. Hiérarchie des dossiers
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

// Helper récursif
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

    // --- 1. CHARGEMENT DES DONNÉES ---
    const refreshTree = useCallback(async () => {
        try {
            const [dirs, notes] = await Promise.all([
                getAllDirectories(),
                getAllNotes()
            ]);
            setTreeData(buildTree(dirs, notes));
        } catch (e) {
            console.error("Erreur chargement grimoire complet", e);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        refreshTree().finally(() => setIsLoading(false));
    }, [refreshTree]);

    // --- 2. CALCUL DES PARENTS (Doit être AVANT la recherche) ---
    const { parentById, allNodes } = useMemo(() => {
        const parentMap = new Map<string, string | null>();
        const nodesList: TreeNode[] = [];
        const stack: Array<{ node: TreeNode; parent: string | null }> = [];

        for (let i = treeData.length - 1; i >= 0; i--) {
            stack.push({ node: treeData[i], parent: null });
        }

        let loopSafety = 0;
        while (stack.length) {
            loopSafety++; if(loopSafety > 20000) break;

            const popped = stack.pop();
            if (popped) {
                const { node, parent: p } = popped;
                parentMap.set(node.id, p);
                nodesList.push(node);
                if (node.children) {
                    for (let i = node.children.length - 1; i >= 0; i--) {
                        stack.push({ node: node.children[i], parent: node.id });
                    }
                }
            }
        }
        return { parentById: parentMap, allNodes: nodesList };
    }, [treeData]);

    // --- 3. LOGIQUE DE RECHERCHE (Utilise parentById calculé juste au-dessus) ---
    const matchSet = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return null;

        const set = new Set<string>();
        // Ici, on utilise 'allNodes' et 'parentById' qui sont garantis d'exister
        for (const node of allNodes) {
            if (node.name.toLowerCase().includes(q)) {
                set.add(node.id);
                let cur = node.id;
                let depth = 0;
                while (depth < 50) {
                    const p = parentById.get(cur); // C'est cette ligne qui plantait
                    if (!p) break;
                    set.add(p);
                    cur = p;
                    depth++;
                }
            }
        }
        return set;
    }, [search, allNodes, parentById]);

    // --- 4. LISTE VISIBLE APLATIE (Pour le rendu) ---
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
                // Filtrage
                if (!matchSet || matchSet.has(node.id)) {
                    list.push({
                        id: node.id,
                        name: node.name,
                        type: node.type,
                        depth,
                        hasChildren: !!node.children?.length
                    });
                }

                // Expansion
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

    // --- ACTIONS ---
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

    return {
        treeData,
        allNodes,
        isLoading,
        search, setSearch,
        expanded, setExpanded, toggleExpand,
        activeId, setActiveId,
        visibleItems, matchSet, refreshTree
    };
};