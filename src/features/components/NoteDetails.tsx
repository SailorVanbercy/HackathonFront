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
} from "../services/notes/noteService";
import Sidebar from "./SideBar/sidebar";

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // États existants
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);

  // Popup d'erreur personnalisée
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Clé pour rafraîchir la Sidebar
  const [sidebarKey, setSidebarKey] = useState(0);

  // Cooldown simple: griser 2.5s sans timer visuel
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: "",
    editable: true,
    editorProps: { attributes: { class: "tiptap-content" } },
  });

  // Synchronisation mode lecture/écriture
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  // Chargement initial de la note
  useEffect(() => {
    if (!id || !editor) return;
    const loadData = async () => {
      try {
        const note = await getNoteById(Number(id));
        setTitle(note.name);
        const htmlContent = note.content ? marked.parse(note.content) : "";

        // Petit délai pour s'assurer que l'éditeur est prêt
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(htmlContent);
          }
        }, 0);
      } catch (error) {
        console.error("Erreur chargement:", error);
        navigate("/home");
      }
    };
    loadData();
  }, [id, editor, navigate]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien magique :", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Cooldown 2.5s après sauvegarde
  const startCooldown = () => {
    setIsCooldown(true);

    // Nettoyer un ancien timeout au cas où
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
      cooldownTimeoutRef.current = null;
    }

    cooldownTimeoutRef.current = setTimeout(() => {
      setIsCooldown(false);
      cooldownTimeoutRef.current = null;
    }, 2500);
  };

  // Nettoyage du timeout au démontage
  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = null;
      }
    };
  }, []);

  // Vérifie si le contenu éditeur est vide (ignore les balises/espaces)
  const isEditorContentEmpty = () => {
    if (!editor) return true;
    const plainText = editor.getText().trim(); // TipTap fournit le texte brut sans balises
    return plainText.length === 0;
  };

  const handleSaveContent = async () => {
    if (!editor) return;

    // Empêche une nouvelle sauvegarde si cooldown actif
    if (isCooldown) return;

    // ⛔ Validation : contenu vide → popup d'erreur, on stoppe tout
    if (isEditorContentEmpty()) {
      setErrorMessage("Invocation raté : le contenu de la page est vide.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000); // auto-hide après 3s
      return;
    }

    setIsSaving(true);

    const html = editor.getHTML();
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    const markdown = turndownService.turndown(html);

    try {
      // Mise à jour de la note en base de données
      await updateNote(Number(id), { name: title, content: markdown });

      // Popup succès
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 3000);

      // Rafraîchir la Sidebar immédiatement
      setSidebarKey((prev) => prev + 1);

      // Démarrer le cooldown de 2.5s
      startCooldown();
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur est survenue lors de l'enregistrement.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote(Number(id));
      navigate("/home");
    } catch (error) {
      console.error(error);
      setErrorMessage("Erreur lors de la suppression de la note !");
      setShowErrorPopup(true);
    }
  };

  if (!editor) return null;

  return (
    <div className="grim-layout">
      {/* Sidebar avec la clé dynamique pour le rechargement */}
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
                title="Gras"
              >
                B
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`tool-btn ${editor.isActive("italic") ? "active" : ""}`}
                title="Italique"
              >
                I
              </button>
              <button
                onClick={setLink}
                className={`tool-btn ${editor.isActive("link") ? "active" : ""}`}
                title="Lien"
              >
                🔗
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`tool-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
                title="Titre 1"
              >
                H1
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`tool-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
                title="Titre 2"
              >
                H2
              </button>
              <button
                onClick={() => setShowInfoModal(true)}
                className="tool-btn info-btn"
                title="Guide Markdown"
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
                  title="Mode Lecture"
                >
                  👁️
                </button>
                <button
                  onClick={handleSaveContent}
                  className="grim-btn save-btn"
                  disabled={isSaving || isCooldown}
                  title={isCooldown ? "Patientez un instant..." : "Sauvegarder"}
                >
                  {isSaving ? "⏳..." : isCooldown ? "⏳" : "💾 Sauvegarder"}
                </button>
              </>
            )}
            <button onClick={handleDelete} className="grim-btn delete-btn">
              ❌ Supprimer
            </button>
          </div>
        </div>

        <div
          className="grim-paper"
          onClick={() => !isReadOnly && editor.chain().focus().run()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Modale d'aide */}
      {showInfoModal && (
        <div
          className="grim-modal-overlay"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="grim-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="grim-modal-title">📖 Grimoire de Syntaxe</h2>
            <div className="grim-markdown-guide">
              <div className="guide-item">
                <span>**Gras**</span> <span>Gras (Ctrl+B)</span>
              </div>
              <div className="guide-item">
                <span>*Italique*</span> <span>Italique (Ctrl+I)</span>
              </div>
              <div className="guide-item">
                <span># H1</span> <span>Grand Titre</span>
              </div>
              <div className="guide-item">
                <span>## H2</span> <span>Sous-titre</span>
              </div>
              <div className="guide-item">
                <span>&gt; Citation</span> <span>Bloc de citation</span>
              </div>
              <div className="guide-item">
                <span>`Code`</span> <span>Code en ligne</span>
              </div>
            </div>
            <button
              className="grim-btn close-modal-btn"
              onClick={() => setShowInfoModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Popup de succès */}
      {showSavePopup && (
        <div className="grim-save-popup">
          <div className="popup-icon">✨</div>
          <div className="popup-text">Sortilège mis à jour !</div>
        </div>
      )}

      {/* Popup d'erreur */}
      {showErrorPopup && (
        <div className="grim-error-popup">
          <div className="popup-icon">⚠️</div>
          <div className="popup-text">{errorMessage || "Erreur inconnue."}</div>
        </div>
      )}
    </div>
  );
};

export default NoteDetails;
