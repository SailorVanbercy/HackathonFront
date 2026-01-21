import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { DirectoryDTO } from "../../../services/directories/directoryService";

// --- HOOK UTILITAIRE (Inchangé) ---
const useModalShortcut = (isOpen: boolean, onClose: () => void, onConfirm?: () => void) => {
    useEffect(() => {
        // Si la modale est fermée, on ne fait rien
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // ECHAP : On ferme toujours
            if (e.key === "Escape" || e.key === "Esc") {
                // On évite preventDefault sur Echap car ça peut bloquer la sortie de plein écran navigateur
                onClose();
            }
            // ENTER : On confirme si une action est fournie
            if (e.key === "Enter" && onConfirm) {
                e.preventDefault(); // Empêche le saut de ligne ou submit classique
                onConfirm();
            }
        };

        // On écoute sur document plutôt que window pour être plus sûr dans le DOM React
        document.addEventListener("keydown", handleKeyDown);

        // Nettoyage
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, onConfirm]);
};

// --- PROPS (Inchangées) ---
interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, parentId: number | null) => void;
    directories: DirectoryDTO[];
}

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, directoryId: number) => void;
    directories: DirectoryDTO[];
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

// --- MODALE DOSSIER (CORRIGÉE POUR ANIMATION DE SORTIE) ---
export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
                                                                        isOpen, onClose, onSubmit, directories
                                                                    }) => {
    const [name, setName] = useState("");
    const [selectedParentId, setSelectedParentId] = useState<string>("");

    const rootDir = directories.find(d => d.name.toLowerCase() === "root");
    const visibleDirs = directories.filter(d => d.name.toLowerCase() !== "root");

    const activeParentId = selectedParentId !== "" ? selectedParentId : (rootDir ? rootDir.id.toString() : "");

    const handleSubmit = () => {
        if (!name.trim()) return;
        const parentIdNumber = activeParentId ? parseInt(activeParentId, 10) : null;
        onSubmit(name, parentIdNumber);
        setName("");
        onClose();
    };

    useModalShortcut(isOpen, onClose, name.trim() ? handleSubmit : undefined);

    // SUPPRIMÉ ICI : if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* AJOUTÉ ICI : La condition est déplacée à l'intérieur */}
            {isOpen && (
                <motion.div className="modal-overlay" initial="hidden" animate="visible" exit="hidden" variants={overlayVariants}>
                    <motion.div className="modal-content" variants={modalVariants}>
                        <h2 className="modal-title">Nouveau Grimoire</h2>
                        <div className="modal-body">
                            <div>
                                <label className="modal-label">Nom du dossier</label>
                                <input autoFocus className="magic-input" placeholder="Ex: Sortilèges" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="modal-label">Emplacement</label>
                                <select className="magic-select" value={activeParentId} onChange={e => setSelectedParentId(e.target.value)}>
                                    {rootDir && <option value={rootDir.id}>Racine</option>}
                                    {visibleDirs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
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

// --- MODALE NOTE (CORRIGÉE POUR ANIMATION DE SORTIE) ---
export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
                                                                    isOpen, onClose, onSubmit, directories
                                                                }) => {
    const [name, setName] = useState("");
    const [userSelectedDirId, setUserSelectedDirId] = useState<string | null>(null);

    const rootDir = directories.find(d => d.name.toLowerCase() === "root");
    const otherDirs = directories.filter(d => d.name.toLowerCase() !== "root");

    const defaultDirId = rootDir
        ? rootDir.id.toString()
        : (directories.length > 0 ? directories[0].id.toString() : "");

    const activeDirId = userSelectedDirId !== null ? userSelectedDirId : defaultDirId;

    const handleSubmit = () => {
        if (!name.trim()) return;
        const dirIdNumber = activeDirId ? parseInt(activeDirId, 10) : 0;
        onSubmit(name, dirIdNumber);
        setName("");
        setUserSelectedDirId(null);
        onClose();
    };

    useModalShortcut(isOpen, onClose, name.trim() ? handleSubmit : undefined);

    // SUPPRIMÉ ICI : if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* AJOUTÉ ICI : La condition est déplacée à l'intérieur */}
            {isOpen && (
                <motion.div className="modal-overlay" initial="hidden" animate="visible" exit="hidden" variants={overlayVariants}>
                    <motion.div className="modal-content" variants={modalVariants}>
                        <h2 className="modal-title">Nouveau Parchemin</h2>
                        <div className="modal-body">
                            <div>
                                <label className="modal-label">Titre</label>
                                <input autoFocus className="magic-input" placeholder="Titre..." value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="modal-label">Grimoire</label>
                                <select className="magic-select" value={activeDirId} onChange={e => setUserSelectedDirId(e.target.value)}>
                                    {rootDir && <option value={rootDir.id}>Racine</option>}
                                    {otherDirs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
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

// --- MODALE RENAME (Déjà correcte) ---
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

// --- MODALE DELETE (Déjà correcte) ---
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

// --- MODALE EXPORT (Déjà correcte) ---
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