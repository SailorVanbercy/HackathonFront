import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TurndownService from "turndown";
import { marked } from "marked";
import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import "./NoteDetails.css";
import {
  deleteNote,
  getNoteById,
  updateNote,
  getMetaData,
  getAllNotes, // Assure-toi d'avoir ajouté cette fonction dans noteService
} from "../services/notes/noteService";
import Sidebar from "./SideBar/sidebar";
import type { MetaDataDTO } from "../services/notes/noteService";
import { useHotkeys } from "react-hotkeys-hook";

// --- Types ---
type NoteSummary = { id: number; name: string };

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const formatBytes = (bytes: number, decimals = 1) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${v} ${sizes[i]}`;
};

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // États existants
  const [title, setTitle] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // États pour la gestion des liens
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [notesList, setNotesList] = useState<NoteSummary[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [externalUrl, setExternalUrl] = useState("");

  // Refs pour éviter les "Stale Closures" dans l'éditeur
  const isReadOnlyRef = useRef(isReadOnly);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    isReadOnlyRef.current = isReadOnly;
  }, [isReadOnly]);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Popup d'erreur
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Metadata
  const [metadata, setMetadata] = useState<MetaDataDTO | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Clé de sidebar
  const [sidebarKey, setSidebarKey] = useState(0);

  // Indicateur visuel autosave
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty">(
    "saved",
  );

  // Debounce + queue
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedTitleRef = useRef<string>("");
  const lastSavedContentRef = useRef<string>("");

  // On étend l'extension Link pour rendre l'attribut target DYNAMIQUE
  const CustomLink = Link.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        href: {
          default: null,
        },
        target: {
          default: null,
          parseHTML: (element) => element.getAttribute("target"),
          renderHTML: (attributes) => {
            // C'est ICI que se trouve la magie 🪄
            // Si le lien est interne (/note/...), on ne met pas de target
            if (attributes.href && attributes.href.startsWith("/note/")) {
              return {};
            }
            // Sinon (lien externe), on force l'ouverture dans un nouvel onglet
            return {
              target: "_blank",
              rel: "noopener noreferrer", // Sécurité standard
            };
          },
        },
      };
    },
  });

  // --- CONFIGURATION DE L'ÉDITEUR ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      // On utilise notre extension intelligente ici
      CustomLink.configure({
        openOnClick: false, // On garde false pour gérer l'interne nous-mêmes
        autolink: true,
      }),
    ],
    content: "",
    editable: true,
    editorProps: {
      attributes: { class: "tiptap-content" },

      handleDOMEvents: {
        blur: () => {
          scheduleAutosave(0);
          return false;
        },
      },

      // Le gestionnaire devient très simple et ne gère QUE l'interne
      handleClick: (view, pos, event) => {
        const isReadMode = isReadOnlyRef.current;
        const target = event.target as HTMLElement;
        const link = target.closest("a");

        if (link && link.href) {
          const url = new URL(link.href);
          const currentOrigin = window.location.origin;

          // On vérifie si c'est interne
          const isInternal =
            url.origin === currentOrigin && url.pathname.startsWith("/note/");

          // CAS 1 : Lien Interne -> On intercepte pour la SPA
          if (isInternal) {
            event.preventDefault(); // On bloque le navigateur
            navigateRef.current(url.pathname); // On navigue avec React Router
            return true;
          }

          // CAS 2 : Lien Externe -> ON NE FAIT RIEN DU TOUT.
          // Grâce à CustomLink, le HTML contient déjà target="_blank".
          // Le navigateur va donc l'ouvrir dans un nouvel onglet naturellement.
          // Pas de JS = Pas de bug de double ouverture.
          return false;
        }
        return false;
      },
    },

    onUpdate: () => {
      setSaveStatus("dirty");
      scheduleAutosave();
    },
  });

  // --- LOGIQUE METADATA & CHARGEMENT ---

  const fetchMetadata = useCallback(
    async (isSilent = false) => {
      if (!id) return;
      if (!isSilent) setIsMetaLoading(true);
      setMetaError(null);
      try {
        const md = await getMetaData(Number(id));
        setMetadata(md);
      } catch (e) {
        console.error("Erreur metadata:", e);
        setMetaError("Impossible de récupérer les métadonnées.");
      } finally {
        if (!isSilent) setIsMetaLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!editor) return;
    const updateLocalMeta = () => {
      const plain = editor.getText();
      const countWords = (text: string) =>
        (text.trim().match(/\S+/g) || []).length;
      const countLines = (text: string) =>
        text ? text.split(/\r\n|\r|\n/).length : 0;
      const byteSize = new Blob([editor.getHTML()]).size;
      setMetadata((prev) =>
        prev
          ? {
              ...prev,
              characterCount: plain.length,
              wordCount: countWords(plain),
              lineCount: countLines(plain),
              byteSize,
            }
          : prev,
      );
    };
    editor.on("update", updateLocalMeta);
    updateLocalMeta();
    return () => {
      editor.off("update", updateLocalMeta);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  useEffect(() => {
    if (!id || !editor) return;
    const loadData = async () => {
      try {
        const note = await getNoteById(Number(id));
        setTitle(note.name);
        lastSavedTitleRef.current = note.name;
        const htmlContent = note.content ? marked.parse(note.content) : "";
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(htmlContent);
            lastSavedContentRef.current = note.content ?? "";
          }
        }, 0);
        fetchMetadata();
      } catch (err) {
        console.error("Erreur chargement:", err);
        navigate("/home");
      } finally {
        setIsMetaLoading(false);
      }
    };
    loadData();
  }, [id, editor, navigate, fetchMetadata]);

  // --- LOGIQUE LIENS (Modale) ---

  const openLinkModal = useCallback(async () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setExternalUrl(previousUrl);
    setSelectedNoteId("");

    try {
      const notes = await getAllNotes();
      setNotesList(notes);
    } catch (e) {
      console.error("Erreur chargement liste notes", e);
    }
    setShowLinkModal(true);
  }, [editor]);

  const applyLink = () => {
    if (!editor) return;
    let url = "";
    if (selectedNoteId) {
      url = `/note/${selectedNoteId}`;
    } else {
      url = externalUrl;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }

    setShowLinkModal(false);
    setSelectedNoteId("");
    setExternalUrl("");
  };

  // --- LOGIQUE AUTOSAVE ---

  const isEditorContentEmpty = () => {
    if (!editor) return true;
    return editor.getText().trim().length === 0;
  };

  const saveNow = async () => {
    if (!editor || !id) return;
    const html = editor.getHTML();
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    const markdown = turndownService.turndown(html);

    const titleChanged = title !== lastSavedTitleRef.current;
    const contentChanged = markdown !== lastSavedContentRef.current;

    if (!titleChanged && !contentChanged) {
      setSaveStatus("saved");
      return;
    }

    if (isEditorContentEmpty()) {
      setSaveStatus("dirty");
      return;
    }

    setSaveStatus("saving");

    savingQueueRef.current = savingQueueRef.current
      .catch(() => {})
      .then(async () => {
        try {
          await updateNote(Number(id), { name: title, content: markdown });
          lastSavedTitleRef.current = title;
          lastSavedContentRef.current = markdown;
          setSaveStatus("saved");
          setSidebarKey((prev) => prev + 1);
          await fetchMetadata(true);
        } catch (err) {
          console.error("Erreur save:", err);
          setSaveStatus("dirty");
        }
      });

    await savingQueueRef.current;
    await fetchMetadata();
  };

  const scheduleAutosave = (delay = 600) => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => saveNow(), delay);
  };

  useEffect(() => {
    const handler = () => saveNow();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editor, title]);

  useEffect(() => {
    if (!editor) return;
    setSaveStatus("dirty");
    scheduleAutosave();
  }, [title]);

  // --- ACTIONS DIVERSES ---

  const handleDelete = async () => {
    try {
      await deleteNote(Number(id));
      navigate("/home");
    } catch {
      setErrorMessage("Erreur lors de la suppression de la note !");
      setShowErrorPopup(true);
    }
  };

  // Hotkeys
  useHotkeys(
    "alt+v",
    (e) => {
      e.preventDefault();
      setIsReadOnly(!isReadOnly);
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
      preventDefault: true,
    },
  );
  useHotkeys(
    "alt+i",
    (e) => {
      e.preventDefault();
      setShowInfoModal(!showInfoModal);
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
      preventDefault: true,
    },
  );
  useHotkeys(
    "ctrl +enter",
    (e) => {
      e.preventDefault();
      navigate("/home");
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
      preventDefault: true,
    },
  );

  if (!editor) return null;

  return (
    <div className="grim-layout">
      <div className="grim-sidebar-wrapper">
        <Sidebar key={sidebarKey} />
      </div>

      <div
        className={`grim-container ${isReadOnly ? "read-mode" : "edit-mode"}`}
      >
        <div className="grim-header">
          <div className="grim-title-container">
            {isReadOnly ? (
              <h1 className="grim-title-display">{title}</h1>
            ) : (
              <input
                type="text"
                className="grim-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du Sortilège..."
              />
            )}
          </div>

          {!isReadOnly && (
            <div className="grim-toolbar">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`tool-btn ${editor.isActive("bold") ? "active" : ""}`}
              >
                B
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`tool-btn ${editor.isActive("italic") ? "active" : ""}`}
              >
                I
              </button>

              {/* BOUTON LIEN MODIFIÉ : Utilise openLinkModal */}
              <button
                onClick={openLinkModal}
                className={`tool-btn ${editor.isActive("link") ? "active" : ""}`}
              >
                🔗
              </button>

              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`tool-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
              >
                H1
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`tool-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
              >
                H2
              </button>
              <button
                onClick={() => setShowInfoModal(true)}
                className="tool-btn info-btn"
              >
                ❓
              </button>
            </div>
          )}

          <div className="grim-actions">
            {isReadOnly ? (
              <button
                onClick={() => setIsReadOnly(false)}
                className="grim-btn edit-btn"
              >
                ✏️ Modifier
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsReadOnly(true)}
                  className="grim-btn view-btn"
                >
                  👁️
                </button>
              </>
            )}
          </div>
        </div>

        <div
          className="grim-paper"
          onClick={() => !isReadOnly && editor.chain().focus().run()}
        >
          <EditorContent editor={editor} />
        </div>

        {!isMetaLoading && !metaError && metadata && (
          <div className="grim-meta-bar">
            <span title="Dernière modification">
              🕒 {formatDateTime(metadata.updatedAt)}
            </span>
            <span className="meta-sep">•</span>
            <span>📦 {formatBytes(metadata.byteSize)}</span>
            <span className="meta-sep">•</span>
            <span>🔤 {metadata.characterCount}</span>
            <span className="meta-sep">•</span>
            <span>📝 {metadata.wordCount} mots</span>
            <span className="meta-sep">•</span>
            {/* Indicateur Autosave */}
            <span className={`save-status ${saveStatus}`}>
              {saveStatus === "saving"
                ? "⏳ Sauvegarde..."
                : saveStatus === "dirty"
                  ? "✍️ Non enregistré"
                  : "✅ Enregistré"}
            </span>
          </div>
        )}
        {isMetaLoading && (
          <div className="grim-meta-bar">⏳ Synchronisation...</div>
        )}
        {metaError && <div className="grim-meta-bar error">⚠️ {metaError}</div>}
      </div>

      {/* MODALE D'AIDE */}
      {showInfoModal && (
        <div
          className="grim-modal-overlay"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="grim-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="grim-modal-title">Aide Markdown</h2>
            <div className="guide-item">
              <span>**Gras**</span> <span>Ctrl+B</span>
            </div>
            <div className="guide-item">
              <span>*Italique*</span> <span>Ctrl+I</span>
            </div>
            <button
              className="close-modal-btn"
              onClick={() => setShowInfoModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* NOUVEAU : MODALE DE LIENS */}
      {showLinkModal && (
        <div
          className="grim-modal-overlay"
          onClick={() => setShowLinkModal(false)}
        >
          <div
            className="grim-modal-content link-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="grim-modal-title">🔗 Tisser un lien</h3>

            <div className="link-form-group">
              <label>Lier vers une autre page du Grimoire :</label>
              <select
                value={selectedNoteId}
                onChange={(e) => {
                  setSelectedNoteId(e.target.value);
                  if (e.target.value) setExternalUrl("");
                }}
                className="grim-input"
              >
                <option value="">-- Choisir une note --</option>
                {notesList.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grim-divider">
              <span>OU</span>
            </div>

            <div className="link-form-group">
              <label>Lien externe (URL) :</label>
              <input
                type="text"
                value={externalUrl}
                onChange={(e) => {
                  setExternalUrl(e.target.value);
                  if (e.target.value) setSelectedNoteId("");
                }}
                placeholder="https://..."
                className="grim-input"
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowLinkModal(false)}
                className="grim-btn delete-btn"
              >
                Annuler
              </button>
              <button onClick={applyLink} className="grim-btn save-btn">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorPopup && (
        <div className="grim-error-popup">
          <div className="popup-icon">⚠️</div>
          <div className="popup-text">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};

export default NoteDetails;
