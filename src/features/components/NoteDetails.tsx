import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link"; // <--- NOUVEL IMPORT
import TurndownService from "turndown";
import { useNavigate } from "react-router";
import { useCallback } from "react"; // Pour optimiser la fonction du lien
import "./NoteDetails.css";

const NoteDetails = () => {
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [
      StarterKit,
      // Configuration des liens
      Link.configure({
        openOnClick: false, // Empêche d'ouvrir le lien quand on clique dessus pour l'éditer
        autolink: true, // Convertit automatiquement les URL tapées (ex: www.google.com)
      }),
    ],
    content: `
      <h1>Le Grimoire des Ombres</h1>
      <p>Bienvenue. Essayez d'ajouter un <a href="https://fr.wikipedia.org/wiki/Magie_(surnaturel)">lien magique</a> ici.</p>
    `,
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  // Fonction pour ajouter ou modifier un lien
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    // Demande l'URL à l'utilisateur via une fenêtre native
    const url = window.prompt("URL du lien magique :", previousUrl);

    // Si annulé, on ne fait rien
    if (url === null) {
      return;
    }

    // Si vide, on retire le lien
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Sinon, on applique le lien
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleLogContent = () => {
    if (!editor) return;

    const html = editor.getHTML();

    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    // Turndown gère nativement les liens <a> vers [text](url)
    const markdown = turndownService.turndown(html);

    console.group("🔮 Contenu Capturé");
    console.log("%c HTML :", "color: orange;", html);
    console.log("%c MARKDOWN :", "color: cyan; font-weight: bold;", markdown);
    console.groupEnd();

    alert("Incantation capturée ! Vérifiez la console.");
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="grim-container">
      <div className="grim-header">
        <button onClick={() => navigate("/home")} className="grim-btn back-btn">
          ⬅ Retour
        </button>

        <div className="grim-toolbar">
          {/* Bouton Gras */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`tool-btn ${editor.isActive("bold") ? "active" : ""}`}
            title="Gras"
          >
            B
          </button>

          {/* Bouton Italique */}
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`tool-btn ${editor.isActive("italic") ? "active" : ""}`}
            title="Italique"
          >
            I
          </button>

          {/* --- NOUVEAU BOUTON LIEN --- */}
          <button
            onClick={setLink}
            className={`tool-btn ${editor.isActive("link") ? "active" : ""}`}
            title="Ajouter un lien"
          >
            🔗
          </button>
          {/* --------------------------- */}

          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`tool-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
            title="Titre H1"
          >
            H1
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`tool-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
            title="Titre H2"
          >
            H2
          </button>
        </div>

        <button onClick={handleLogContent} className="grim-btn save-btn">
          📜 Capturer le Sort
        </button>
      </div>

      <div className="grim-paper" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default NoteDetails;
