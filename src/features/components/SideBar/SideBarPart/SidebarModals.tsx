import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// --- HOOK UTILITAIRE (Inchangé) ---
const useModalShortcut = (isOpen: boolean, onClose: () => void, onConfirm?: () => void) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.key === "Esc") {
                onClose();
            }
            if (e.key === "Enter" && onConfirm) {
                e.preventDefault();
                onConfirm();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, onConfirm]);
};

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, parentId: number | null) => void;
    targetParentId: number | null; // On passe l'ID directement
}

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, directoryId: number) => void;
    targetDirectoryId: number | null; // On passe l'ID directement
}

interface CommonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- VARIANTS (Inchangés) ---
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0, y: 20 },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: {
        scale: 0.8,
        opacity: 0,
        y: -20,
        transition: { duration: 0.2 }
    },
};

// --- MODALE DOSSIER (Simplifiée) ---
export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
                                                                        isOpen, onClose, onSubmit, targetParentId
                                                                    }) => {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        // On utilise directement le targetParentId fourni par le contexte
        onSubmit(name, targetParentId);
        setName("");
        onClose();
    };

    useModalShortcut(isOpen, onClose, name.trim() ? handleSubmit : undefined);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="modal-overlay" initial="hidden" animate="visible" exit="hidden" variants={overlayVariants}>
                    <motion.div className="modal-content" variants={modalVariants}>
                        <h2 className="modal-title">Nouveau Grimoire</h2>
                        <div className="modal-body">
                            <div>
                                <label className="modal-label">Nom du dossier</label>
                                <input autoFocus className="magic-input" placeholder="Ex: Sortilèges Interdits" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            {/* Suppression du Select : L'emplacement est défini par le clic droit */}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={onClose}>Annuler</button>
                            <button className="btn-magic" onClick={handleSubmit} disabled={!name.trim()}>Créer</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- MODALE NOTE (Simplifiée) ---
export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
                                                                    isOpen, onClose, onSubmit, targetDirectoryId
                                                                }) => {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        // targetDirectoryId peut être null (racine) ou un nombre. Le service gère le 0/null.
        const dirId = targetDirectoryId || 0;
        onSubmit(name, dirId);
        setName("");
        onClose();
    };

    useModalShortcut(isOpen, onClose, name.trim() ? handleSubmit : undefined);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="modal-overlay" initial="hidden" animate="visible" exit="hidden" variants={overlayVariants}>
                    <motion.div className="modal-content" variants={modalVariants}>
                        <h2 className="modal-title">Nouveau Parchemin</h2>
                        <div className="modal-body">
                            <div>
                                <label className="modal-label">Titre</label>
                                <input autoFocus className="magic-input" placeholder="Titre du sort..." value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            {/* Suppression du Select */}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={onClose}>Annuler</button>
                            <button className="btn-magic" onClick={handleSubmit} disabled={!name.trim()}>Incantation</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- AUTRES MODALES (Inchangées - juste exportées) ---
interface RenameModalProps extends CommonModalProps { onSubmit: (id: string, name: string) => void; value: string; setValue: (v: string) => void; }
export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onSubmit, value, setValue }) => {
    useModalShortcut(isOpen, onClose, () => onSubmit("", value));
    return (
        <AnimatePresence>
            {isOpen && <motion.div className="modal-overlay" initial="hidden" animate="visible" exit="hidden" variants={overlayVariants}>
                <motion.div className="modal-content" variants={modalVariants}>
                    <h2 className="modal-title">Renommer</h2>
                    <input autoFocus className="magic-input" value={value} onChange={e => setValue(e.target.value)} />
                    <div className="modal-actions">
                        <button className="btn-ghost" onClick={onClose}>Annuler</button>
                        <button className="btn-magic" onClick={() => onSubmit("", value)}>Valider</button>
                    </div>
                </motion.div>
            </motion.div>}
        </AnimatePresence>
    );
};

interface DeleteModalProps extends CommonModalProps { onConfirm: () => void; }
export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
    useModalShortcut(isOpen, onClose, onConfirm);
    return (
        <AnimatePresence>
            {isOpen && <motion.div className="modal-overlay" initial="hidden" animate="visible" exit="hidden" variants={overlayVariants}>
                <motion.div className="modal-content" variants={modalVariants}>
                    <h2 className="modal-title" style={{ color: '#ef4444' }}>Destruction</h2>
                    <p>Êtes-vous sûr de vouloir détruire cet élément ?</p>
                    <div className="modal-actions">
                        <button className="btn-ghost" onClick={onClose}>Non</button>
                        <button className="btn-magic" onClick={onConfirm} style={{ background: '#ef4444' }}>OUI</button>
                    </div>
                </motion.div>
            </motion.div>}
        </AnimatePresence>
    );
};

interface ExportModalProps extends CommonModalProps { onConfirm: (f: 'zip' | 'pdf' | 'md') => void; folderName?: string; itemType: 'directory' | 'note'; }
export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onConfirm, folderName, itemType }) => {
    useModalShortcut(isOpen, onClose);
    return (
        <AnimatePresence>
            {isOpen && <motion.div className="modal-overlay" initial="hidden" animate="visible" exit="hidden" variants={overlayVariants}>
                <motion.div className="modal-content" variants={modalVariants}>
                    <h2 className="modal-title">Exporter {folderName}</h2>
                    <div className="export-options">
                        {itemType === 'directory' && (
                            <div className="export-card" onClick={() => onConfirm('zip')}>
                                <div className="export-icon">📦</div>
                                <div className="export-info"><h4>Archive ZIP</h4><p>Tout le contenu</p></div>
                            </div>
                        )}
                        {itemType === 'note' && (
                            <>
                                <div className="export-card" onClick={() => onConfirm('pdf')}>
                                    <div className="export-icon">📜</div>
                                    <div className="export-info"><h4>Document PDF</h4><p>Format imprimable</p></div>
                                </div>
                                <div className="export-card" onClick={() => onConfirm('md')}>
                                    <div className="export-icon">📝</div>
                                    <div className="export-info"><h4>Markdown</h4><p>Format brut</p></div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="modal-actions"><button className="btn-ghost" onClick={onClose}>Fermer</button></div>
                </motion.div>
            </motion.div>}
        </AnimatePresence>
    );
};