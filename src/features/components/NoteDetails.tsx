import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TurndownService from "turndown"; // <--- 1. IMPORT DU CONVERTISSEUR
import { useNavigate } from "react-router";
import "./NoteDetails.css";

const NoteDetails = () => {
  const navigate = useNavigate();

  // Configuration de Tiptap (Plus simple, plus d'extension markdown ici)
  const editor = useEditor({
    extensions: [StarterKit],
    content: `
      <h1>Le Grimoire des Ombres</h1>
      <p>Bienvenue, sorcier. Ce parchemin est magique :</p>
      <ul>
        <li>Tapez <code># </code> pour un grand titre</li>
        <li>Tapez <code>- </code> pour une liste</li>
        <li>Tapez <code>> </code> pour une citation mystique</li>
      </ul>
      <p>Essayez d'écrire ci-dessous...</p>
    `,
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  const handleLogContent = () => {
    if (!editor) return;

    // 1. Récupérer le HTML (Ça marche toujours)
    const html = editor.getHTML();

    // 2. Convertir le HTML en Markdown via Turndown
    const turndownService = new TurndownService({
      headingStyle: "atx", // Force les titres avec des # au lieu de soulignés
      codeBlockStyle: "fenced", // Utilise ``` pour le code
    });

    const markdown = turndownService.turndown(html);

    console.group("🔮 Contenu Capturé");
    console.log("%c HTML (Pour le site) :", "color: orange;", html);
    console.log(
      "%c MARKDOWN (Pour la BDD) :",
      "color: cyan; font-weight: bold;",
      markdown,
    );
    console.groupEnd();

    alert("Incantation capturée ! Vérifiez la console (F12).");
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
