import React, { useEffect, useState } from "react";
import { getAllNotes } from "../../../services/notes/noteService";

interface LinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string) => void;
    initialUrl: string;
}

export const LinkModal: React.FC<LinkModalProps> = ({
                                                        isOpen,
                                                        onClose,
                                                        onSubmit,
                                                        initialUrl,
                                                    }) => {
    const [notesList, setNotesList] = useState<{ id: number; name: string }[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string>("");
    const [externalUrl, setExternalUrl] = useState("");

    // Initialisation à l'ouverture
    useEffect(() => {
        if (isOpen) {
            if (initialUrl.startsWith("/note/")) {
                setExternalUrl("");
                setSelectedNoteId(initialUrl.replace("/note/", ""));
            } else {
                setExternalUrl(initialUrl);
                setSelectedNoteId("");
            }
            // Charger la liste des notes
            getAllNotes()
                .then(setNotesList)
                .catch((e) => console.error("Erreur chargement notes", e));
        }
    }, [isOpen, initialUrl]);

    const handleSubmit = () => {
        let finalUrl = "";
        if (selectedNoteId) {
            finalUrl = `/note/${selectedNoteId}`;
        } else {
            finalUrl = externalUrl;
        }
        onSubmit(finalUrl);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="grim-modal-overlay" onClick={onClose}>
            <div className="grim-modal-content link-modal" onClick={(e) => e.stopPropagation()}>
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
                    <button onClick={onClose} className="grim-btn delete-btn">
                        Annuler
                    </button>
                    <button onClick={handleSubmit} className="grim-btn save-btn">
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
};