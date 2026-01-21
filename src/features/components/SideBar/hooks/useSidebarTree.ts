import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllDirectories, type DirectoryDTO } from "../../../services/directories/directoryService";
import { getAllNotes, type NoteTreeItemDTO } from "../../../services/notes/noteService";
import type { FlatItem } from "../SideBarPart/sidebarTypes";

// Nom technique du dossier racine
const HIDDEN_ROOT_NAME = "root";

export const useSidebarTree = (searchQuery: string = "") => {
    // Données brutes
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const matches = new Set<string>(); // IDs des éléments qui matchent le texte (pour surlignage)
        const nodesMap = new Map<string, { name: string; type: 'directory' | 'note' }>();

        const isSearching = searchQuery.trim().length > 0;
        const lowerQuery = searchQuery.toLowerCase();

        // --- PHASE DE PRÉ-CALCUL (FILTRAGE STRICT) ---
        // Set des IDs de dossiers qui doivent être visibles (le chemin vers les résultats)
        const keptDirIds = new Set<number>();

        if (isSearching) {
            // Map pour remonter rapidement aux parents
            const parentMap = new Map<number, number>();
            directories.forEach(d => parentMap.set(d.id, d.parentDirectoryId || 0));

            // Fonction pour marquer un dossier et tous ses ancêtres comme "à garder"
            const keepAncestors = (dirId: number) => {
                let curr: number | undefined = dirId;
                // On remonte tant qu'on a un ID valide et qu'il n'est pas déjà marqué
                while (curr && curr !== 0 && !keptDirIds.has(curr)) {
                    keptDirIds.add(curr);
                    curr = parentMap.get(curr);
                }
            };

            // 1. Trouver les notes correspondantes et garder leurs parents
            notes.forEach(n => {
                if (n.name.toLowerCase().includes(lowerQuery)) {
                    matches.add(`note-${n.id}`);
                    if (n.directoryId) keepAncestors(n.directoryId);
                }
            });

            // 2. Trouver les dossiers correspondants et garder leurs parents
            directories.forEach(d => {
                if (d.name.toLowerCase().includes(lowerQuery)) {
                    matches.add(`dir-${d.id}`);
                    keepAncestors(d.id); // On garde le dossier lui-même
                    // On garde aussi ses parents
                    if (d.parentDirectoryId) keepAncestors(d.parentDirectoryId);
                }
            });
        }
        // ---------------------------------------------

        // Identification du root
        const rootDir = directories.find((d) => d.name === HIDDEN_ROOT_NAME);
        const rootDirId = rootDir?.id;

        // Fonction récursive de traversée
        const traverse = (parentId: number, currentDepth: number) => {

            // Filtrer les DOSSIERS enfants directs
            let currentDirs = directories.filter((d) => {
                if (parentId === 0) return !d.parentDirectoryId || d.parentDirectoryId === 0;
                return d.parentDirectoryId === parentId;
            });

            // Si recherche : on ne garde QUE ceux qui sont sur le chemin d'un résultat
            if (isSearching) {
                currentDirs = currentDirs.filter(d => keptDirIds.has(d.id));
            }

            // Filtrer les NOTES enfants directes
            let currentNotes = notes.filter((n) => {
                if (parentId === 0) return !n.directoryId || n.directoryId === 0;
                return n.directoryId === parentId;
            });

            // Si recherche : on ne garde QUE les notes qui matchent exactement
            if (isSearching) {
                currentNotes = currentNotes.filter(n => matches.has(`note-${n.id}`));
            }

            // --- TRAITEMENT DES DOSSIERS ---
            for (const dir of currentDirs) {
                const strId = `dir-${dir.id}`;
                nodesMap.set(strId, { name: dir.name, type: 'directory' });

                // LOGIQUE ROOT CACHÉ
                if (dir.id === rootDirId) {
                    traverse(dir.id, currentDepth);
                    continue;
                }

                const hasChildren =
                    directories.some((d) => d.parentDirectoryId === dir.id) ||
                    notes.some((n) => n.directoryId === dir.id);

                // En mode recherche, on force l'ouverture car on sait que c'est un dossier "utile"
                const isOpen = expanded[strId] || isSearching;

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

                flatList.push({
                    id: strId,
                    name: note.name,
                    type: "note",
                    depth: currentDepth,
                    hasChildren: false,
                });
            }
        };

        // Démarrage
        traverse(0, 0);

        const allNodesList = Array.from(nodesMap.entries()).map(([id, val]) => ({ id, ...val }));

        return {
            visibleItems: flatList,
            matchSet: isSearching ? matches : null,
            allNodes: allNodesList
        };
    }, [directories, notes, expanded, searchQuery]);

    return {
        directories,
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