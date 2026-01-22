import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

// Configuration de l'extension Link personnalisée
export const getEditorExtensions = () => {
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
                        // Logique intelligente : Interne vs Externe
                        if (attributes.href && attributes.href.startsWith("/note/")) {
                            return {}; // Pas de target pour l'interne (géré par le router)
                        }
                        return {
                            target: "_blank",
                            rel: "noopener noreferrer",
                        };
                    },
                },
            };
        },
    });

    return [
        StarterKit,
        CustomLink.configure({
            openOnClick: false, // On gère le clic nous-mêmes
            autolink: true,
        }),
    ];
};