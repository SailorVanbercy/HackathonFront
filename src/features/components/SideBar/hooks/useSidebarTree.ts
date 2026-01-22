import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllDirectories, type DirectoryDTO } from "../../../services/directories/directoryService";
import { getAllNotes, type NoteTreeItemDTO } from "../../../services/notes/noteService";
import type { FlatItem } from "../SideBarPart/sidebarTypes";

// Technical name for the hidden root directory
const HIDDEN_ROOT_NAME = "root";

export const useSidebarTree = (searchQuery: string = "") => {
    // Raw data
    const [directories, setDirectories] = useState<DirectoryDTO[]>([]);
    const [notes, setNotes] = useState<NoteTreeItemDTO[]>([]);

    // Display state
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeId, setActiveId] = useState<string>("");

    // 1. Data Fetching
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

    // 2. Expand/Collapse toggle logic
    const toggleExpand = useCallback((id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // 3. Visual Tree Construction (FlatList transformation)
    // This hook flattens the recursive structure into a list for rendering
    const { visibleItems, matchSet, allNodes } = useMemo(() => {
        const flatList: FlatItem[] = [];
        const matches = new Set<string>(); // IDs of items matching search query
        const nodesMap = new Map<string, { name: string; type: 'directory' | 'note' }>();

        const isSearching = searchQuery.trim().length > 0;
        const lowerQuery = searchQuery.toLowerCase();

        // --- PRE-CALCULATION PHASE (STRICT FILTERING) ---
        // Set of directory IDs that must remain visible (path to results)
        const keptDirIds = new Set<number>();

        if (isSearching) {
            // Quick lookup map for parent navigation
            const parentMap = new Map<number, number>();
            directories.forEach(d => parentMap.set(d.id, d.parentDirectoryId || 0));

            // Helper to recursively mark ancestors as "kept"
            const keepAncestors = (dirId: number) => {
                let curr: number | undefined = dirId;
                // Move up the tree until root or already visited
                while (curr && curr !== 0 && !keptDirIds.has(curr)) {
                    keptDirIds.add(curr);
                    curr = parentMap.get(curr);
                }
            };

            // 1. Find matching notes and keep their path
            notes.forEach(n => {
                if (n.name.toLowerCase().includes(lowerQuery)) {
                    matches.add(`note-${n.id}`);
                    if (n.directoryId) keepAncestors(n.directoryId);
                }
            });

            // 2. Find matching directories and keep their path
            directories.forEach(d => {
                if (d.name.toLowerCase().includes(lowerQuery)) {
                    matches.add(`dir-${d.id}`);
                    keepAncestors(d.id); // Keep the directory itself
                    // Keep its parents too
                    if (d.parentDirectoryId) keepAncestors(d.parentDirectoryId);
                }
            });
        }
        // ---------------------------------------------

        // Identify root directory
        const rootDir = directories.find((d) => d.name === HIDDEN_ROOT_NAME);
        const rootDirId = rootDir?.id;

        // Recursive Traversal Function
        const traverse = (parentId: number, currentDepth: number) => {

            // Filter direct child DIRECTORIES
            let currentDirs = directories.filter((d) => {
                if (parentId === 0) return !d.parentDirectoryId || d.parentDirectoryId === 0;
                return d.parentDirectoryId === parentId;
            });

            // If searching, only keep directories that are part of a result path
            if (isSearching) {
                currentDirs = currentDirs.filter(d => keptDirIds.has(d.id));
            }

            // Filter direct child NOTES
            let currentNotes = notes.filter((n) => {
                if (parentId === 0) return !n.directoryId || n.directoryId === 0;
                return n.directoryId === parentId;
            });

            // If searching, only keep notes that match exactly
            if (isSearching) {
                currentNotes = currentNotes.filter(n => matches.has(`note-${n.id}`));
            }

            // --- PROCESS DIRECTORIES ---
            for (const dir of currentDirs) {
                const strId = `dir-${dir.id}`;
                nodesMap.set(strId, { name: dir.name, type: 'directory' });

                // HIDDEN ROOT LOGIC: Skip rendering root, just traverse its children
                if (dir.id === rootDirId) {
                    traverse(dir.id, currentDepth);
                    continue;
                }

                const hasChildren =
                    directories.some((d) => d.parentDirectoryId === dir.id) ||
                    notes.some((n) => n.directoryId === dir.id);

                // Auto-expand if searching to show results
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

            // --- PROCESS NOTES ---
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

        // Start traversal from root (ID 0)
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