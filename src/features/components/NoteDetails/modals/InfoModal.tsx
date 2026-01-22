import React from "react";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="grim-modal-overlay" onClick={onClose}>
            <div className="grim-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="grim-modal-title">Aide & Raccourcis</h2>
                <div className="guide-item"><span>**Gras**</span> <span>Ctrl+B</span></div>
                <div className="guide-item"><span>*Italique*</span> <span>Ctrl+I</span></div>
                <div className="guide-item"><span>Souligner</span> <span>Ctrl+U</span></div>
                <div className="guide-item"><span>Texte Barré</span> <span>Alt+S</span></div>
                <div className="guide-item"><span>#Titre 1..6</span> <span>Ctrl+Alt+1..6</span></div>
                <div className="guide-item"><span>Liste à puces</span> <span>Alt+L</span></div>
                <div className="guide-item"><span>Liste numérotée</span> <span>Alt+K</span></div>
                <div className="guide-item"><span>Bloc de code</span> <span>Alt+C</span></div>
                <div className="guide-item"><span>Code en ligne</span> <span>Alt+R</span></div>
                <div className="guide-item"><span>Citation</span> <span>Alt+J</span></div>
                <div className="guide-item"><span>Séparateur</span> <span>Alt+O</span></div>
                <div className="guide-item"><span>Texte brut</span> <span>Alt+X</span></div>
                <div className="guide-item"><span>Date/Heure</span> <span>Alt+H</span></div>
                <div className="guide-item"><span>Dupliquer Note</span> <span>Alt+Y</span></div>
                <div className="guide-item"><span>Revenir au menu principal</span> <span>Ctrl+Enter</span></div>
                <div className="guide-item"><span>Chnager de mode (Ecriture / Lecture)</span> <span>Alt+V</span></div>
                <button className="close-modal-btn" onClick={onClose}>Fermer</button>
            </div>
        </div>
    );
};