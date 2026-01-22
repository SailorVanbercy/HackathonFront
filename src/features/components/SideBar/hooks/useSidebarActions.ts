import { useCallback } from "react";
import { useNavigate } from "react-router"; // ⬅️ Ajout
import {
  createDirectory,
  updateDirectory,
  deleteDirectory,
} from "../../../services/directories/directoryService";
import { createNote, deleteNote } from "../../../services/notes/noteService";
import {
  exportAsZip,
  exportDirAsZip,
  exportNoteAsPdf,
  exportNoteAsMarkdown,
} from "../../../services/export/exportService";
import type { UseSidebarModalsType } from "./useSidebarModals";

interface UseSidebarActionsProps {
  refreshTree: () => Promise<void>;
  modals: UseSidebarModalsType;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const useSidebarActions = ({
  refreshTree,
  modals,
  setExpanded,
}: UseSidebarActionsProps) => {
  const navigate = useNavigate(); // ⬅️ Ajout

  // --- CREATE FOLDER ---
  const handleCreateFolder = useCallback(
    async (name: string, parentId: number | null) => {
      try {
        await createDirectory({ name, parentDirectoryId: parentId });
        if (parentId !== null && parentId !== 0) {
          setExpanded((prev) => ({ ...prev, [`dir-${parentId}`]: true }));
        }
        await refreshTree();
      } catch (error) {
        console.error("Erreur création dossier", error);
      }
    },
    [refreshTree, setExpanded],
  );

  // --- CREATE NOTE ---
  const handleCreateNote = useCallback(
    async (name: string, directoryId: number) => {
      try {
        await createNote({ name, directoryId });

        if (directoryId !== 0) {
          setExpanded((prev) => ({ ...prev, [`dir-${directoryId}`]: true }));
        }
        await refreshTree();
      } catch (error) {
        console.error("Erreur création note", error);
      }
    },
    [refreshTree, setExpanded],
  );

  // --- RENAME ---
  const handleRenameSubmit = useCallback(
    async (_unusedId: string, newName: string) => {
      const id = modals.targetRenameId;
      if (!id) return;
      try {
        const cleanId = String(id).replace("dir-", "").replace("note-", "");
        if (id.startsWith("dir-")) {
          await updateDirectory({ id: Number(cleanId), name: newName });
        }
        await refreshTree();
        modals.setIsRenameOpen(false);
      } catch (error) {
        console.error(error);
      }
    },
    [refreshTree, modals],
  );

  // --- DELETE (redirige vers Home si note) ---
  const handleDeleteConfirm = useCallback(async () => {
    const id = modals.targetDeleteId;
    if (!id) return;
    try {
      const cleanId = String(id).replace("dir-", "").replace("note-", "");
      if (id.startsWith("dir-")) {
        await deleteDirectory(Number(cleanId));
        await refreshTree();
        modals.setIsDeleteOpen(false);
        // Pas de redirection pour un dossier
      } else if (id.startsWith("note-")) {
        await deleteNote(Number(cleanId));
        await refreshTree();
        modals.setIsDeleteOpen(false);
        // ✅ Redirection Home après suppression d’une note
        navigate("/");
      }
    } catch (error) {
      console.error(error);
    }
  }, [modals.targetDeleteId, refreshTree, modals, navigate]); // ⬅️ navigate dans les deps

  // --- EXPORT ---
  const handleExportConfirm = useCallback(
    async (format: "zipAll" | "zipDir" | "pdf" | "md") => {
      const id = modals.targetExportId;
      const name = modals.exportTargetName || "Grimoire_Item";
      const type = modals.exportItemType;
      const cleanId = id
        ? String(id).replace("dir-", "").replace("note-", "")
        : null;
      const numId = cleanId ? Number(cleanId) : null;

      try {
        if (type === "directory") {
          if (format === "zipAll") await exportAsZip();
          else if (format === "zipDir") await exportDirAsZip(name, numId);
        } else if (type === "note" && numId !== null) {
          if (format === "pdf") await exportNoteAsPdf(name, numId);
          else if (format === "md") await exportNoteAsMarkdown(name, numId);
        }
        modals.setIsExportOpen(false);
      } catch (error) {
        console.error("Erreur export", error);
        alert("Échec de l'exportation");
      }
    },
    [modals],
  );

  return {
    handleCreateFolder,
    handleCreateNote,
    handleRenameSubmit,
    handleDeleteConfirm,
    handleExportConfirm,
  };
};
