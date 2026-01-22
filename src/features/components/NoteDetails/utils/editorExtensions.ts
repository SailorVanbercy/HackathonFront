import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

// Custom Link Extension Configuration
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
                        // Smart Logic: Internal vs External
                        // If link points to our internal route, do not open in new tab
                        if (attributes.href && attributes.href.startsWith("/note/")) {
                            return {}; // No target for internal links (handled by router)
                        }
                        // Force external links to open in a new tab for security and UX
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
            openOnClick: false, // We handle clicks manually (see NoteDetails.tsx) to use React Router
            autolink: true,
        }),
    ];
};