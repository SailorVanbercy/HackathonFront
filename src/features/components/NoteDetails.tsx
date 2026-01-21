import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TurndownService from "turndown";
import { marked } from "marked";
import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useState } from "react";
import "./NoteDetails.css";
import { getNoteById, updateNote } from "../services/notes/noteService"; 

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // NOUVEAU : État pour le mode lecture seule (Faux par défaut = Mode Écriture)
  const [isReadOnly, setIsReadOnly] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: "",
    editable: true, // Par défaut, on peut écrire
    editorProps: { attributes: { class: "tiptap-content" } },
  });

  // NOUVEAU : Effet pour synchroniser l'état React avec Tiptap
  useEffect(() => {
    if (!editor) return;
    // Si isReadOnly est true -> editable est false, et inversement
    editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  // Chargement des données
  useEffect(() => {
    if (!id || !editor) return;
    const loadData = async () => {
      try {
        const note = await getNoteById(Number(id));
        setTitle(note.name);
        const htmlContent = note.content ? marked.parse(note.content) : "";

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

  const handleSaveContent = async () => {
    if (!editor) return;
    setIsSaving(true);

    const html = editor.getHTML();
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    const markdown = turndownService.turndown(html);

    try {
      await updateNote(Number(id), { name: title, content: markdown });

      // NOUVEAU (Optionnel) : On passe en lecture seule après la sauvegarde pour confirmer ?
      // Pour l'instant, je laisse le choix à l'utilisateur via le bouton,
      // donc on reste en mode édition après sauvegarde.
      alert("📜 Sortilège inscrit dans le marbre !");
    } catch (error) {
      //alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className={`grim-container ${isReadOnly ? "read-mode" : "edit-mode"}`}>
      <div className="grim-header">
        <button onClick={() => navigate("/home")} className="grim-btn back-btn">
          ⬅ Retour
        </button>

        {/* NOUVEAU : Affichage conditionnel du titre */}
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

        {/* NOUVEAU : La barre d'outils ne s'affiche qu'en mode édition */}
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
            <button
              onClick={setLink}
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
          </div>
        )}

        {/* NOUVEAU : Boutons d'actions (Switch Mode + Save) */}
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
              {/* Bouton pour passer en mode lecture sans sauvegarder */}
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
                disabled={isSaving}
              >
                {isSaving ? "⏳..." : "💾 Sauvegarder"}
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
    </div>
  );
};

export default NoteDetails;
