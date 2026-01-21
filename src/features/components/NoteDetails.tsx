import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TurndownService from "turndown";
import { marked } from "marked";
import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useState } from "react";
import "./NoteDetails.css";

// IMPORT DU SERVICE (Ajustez le chemin selon votre structure)
import { getNoteById, updateNote } from "../services/notes/noteService";

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Configuration Tiptap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: "",
    editorProps: { attributes: { class: "tiptap-content" } },
  });

  // --- 1. CHARGEMENT VIA LE SERVICE ---
  useEffect(() => {
    if (!id || !editor) return;

    const loadData = async () => {
      try {
        // Appel au service (conversion de l'ID en nombre)
        const note = await getNoteById(Number(id));

        setTitle(note.name);

        // Conversion du Markdown (BDD) vers HTML (Éditeur)
        const htmlContent = note.content ? marked.parse(note.content) : "";

        // Mise à jour de l'éditeur sans bloquer le rendu
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(htmlContent);
          }
        }, 0);
      } catch (error) {
        console.error("Erreur chargement:", error);
        alert("Impossible de lire ce parchemin...");
        navigate("/home");
      }
    };

    loadData();
  }, [id, editor, navigate]);

  // Gestion des liens (inchangé)
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

  // --- 2. SAUVEGARDE VIA LE SERVICE ---
  const handleSaveContent = async () => {
    if (!editor) return;
    setIsSaving(true);

    // Conversion HTML (Éditeur) vers Markdown (BDD)
    const html = editor.getHTML();
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    const markdown = turndownService.turndown(html);

    try {
      // Appel au service updateNote
      await updateNote(Number(id), {
        name: title,
        content: markdown,
      });

      console.log("Sauvegarde réussie");
      // Optionnel : Ajouter un petit feedback visuel temporaire (Toast)
      alert("📜 Sortilège inscrit dans le marbre !");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      //alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="grim-container">
      <div className="grim-header">
        <button onClick={() => navigate("/home")} className="grim-btn back-btn">
          ⬅ Retour
        </button>

        <input
          type="text"
          className="grim-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du Sortilège..."
        />

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

        <button
          onClick={handleSaveContent}
          className="grim-btn save-btn"
          disabled={isSaving}
        >
          {isSaving ? "⏳..." : "📜 Sauvegarder"}
        </button>
      </div>

      <div className="grim-paper" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default NoteDetails;
