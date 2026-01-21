import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllDirectories, type DirectoryDTO } from "../../../services/directories/directoryService";
import { getAllNotes, type NoteTreeItemDTO } from "../../../services/notes/noteService";
import type { FlatItem } from "../SideBarPart/sidebarTypes";

// Nom technique du dossier racine
const HIDDEN_ROOT_NAME = "root";

export const useSidebarTree = (searchQuery: string = "") => {
    // Données brutes (pour les modales)
    const [directories, setDirectories] = useState<DirectoryDTO[]>([]);
    const [notes, setNotes] = useState<NoteTreeItemDTO[]>([]);

    // États d'affichage
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeId, setActiveId] = useState<string>("");

    // 1. Chargement des données
    const refreshTree = useCallback(async () => {
        try {
            const [dirs, fetchedNotes] = await Promise.all([
                getAllDirectories(),
                getAllNotes()
            ]);
            setDirectories(dirs);
            setNotes(fetchedNotes);
        } catch (e) {
            console.error("Erreur chargement grimoire", e);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        refreshTree().finally(() => setIsLoading(false));
    }, [refreshTree]);

    // 2. Gestion de l'expansion
    const toggleExpand = useCallback((id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // 3. Construction de l'arbre visuel (FlatList)
    const { visibleItems, matchSet, allNodes } = useMemo(() => {
        const flatList: FlatItem[] = [];
        const matches = new Set<string>();
        const nodesMap = new Map<string, { name: string; type: 'directory' | 'note' }>();

        const isSearching = searchQuery.trim().length > 0;
        const lowerQuery = searchQuery.toLowerCase();

        // Identification du root
        const rootDir = directories.find((d) => d.name === HIDDEN_ROOT_NAME);
        const rootDirId = rootDir?.id;

        // Fonction récursive de traversée
        // parentId : ID technique (number) du parent. 0 ou null pour la racine.
        const traverse = (parentId: number, currentDepth: number) => {

            // Filtrer les enfants directs
            const currentDirs = directories.filter((d) => {
                if (parentId === 0) return !d.parentDirectoryId || d.parentDirectoryId === 0;
                return d.parentDirectoryId === parentId;
            });

            const currentNotes = notes.filter((n) => {
                if (parentId === 0) return !n.directoryId || n.directoryId === 0;
                return n.directoryId === parentId;
            });

            // --- TRAITEMENT DES DOSSIERS ---
            for (const dir of currentDirs) {
                const strId = `dir-${dir.id}`;
                nodesMap.set(strId, { name: dir.name, type: 'directory' });

                // LOGIQUE ROOT CACHÉ
                if (dir.id === rootDirId) {
                    // On traverse les enfants sans ajouter ce dossier à la liste
                    // Et on ne change pas la profondeur (currentDepth reste 0)
                    traverse(dir.id, currentDepth);
                    continue;
                }

                const isMatch = isSearching && dir.name.toLowerCase().includes(lowerQuery);
                if (isMatch) matches.add(strId);

                const hasChildren =
                    directories.some((d) => d.parentDirectoryId === dir.id) ||
                    notes.some((n) => n.directoryId === dir.id);

                const isOpen = expanded[strId] || isSearching;

                // On ajoute le dossier à la liste visible
                flatList.push({
                    id: strId,
                    name: dir.name,
                    type: "directory",
                    depth: currentDepth,
                    hasChildren,
                });

                if (isOpen) {
                    traverse(dir.id, currentDepth + 1);
                }
            }

            // --- TRAITEMENT DES NOTES ---
            for (const note of currentNotes) {
                const strId = `note-${note.id}`;
                nodesMap.set(strId, { name: note.name, type: 'note' });

                const isMatch = isSearching && note.name.toLowerCase().includes(lowerQuery);
                if (isMatch) matches.add(strId);

                if (!isSearching || isMatch) {
                    flatList.push({
                        id: strId,
                        name: note.name,
                        type: "note",
                        depth: currentDepth,
                        hasChildren: false,
                    });
                }
            }
        };

        // Démarrage (0 = racine logique des parents)
        traverse(0, 0);

        // Reconversion de la map en tableau pour allNodes (utile pour l'export/rename)
        const allNodesList = Array.from(nodesMap.entries()).map(([id, val]) => ({ id, ...val }));

        return {
            visibleItems: flatList,
            matchSet: isSearching ? matches : null,
            allNodes: allNodesList
        };
    }, [directories, notes, expanded, searchQuery]);

    return {
        directories, // Export brut pour les modales
        visibleItems,
        allNodes,
        expanded,
        matchSet,
        isLoading,
        toggleExpand,
        refreshTree,
        activeId,
        setActiveId,
        setExpanded
    };
};