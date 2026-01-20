import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {TreeNode} from "./sidebarTypes";

// --- MODALE DE CRÉATION (Dossier OU Note) ---
interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    folderName: string;
    setFolderName: (val: string) => void;
    parentId: string;
    setParentId: (val: string) => void;
    treeData: TreeNode[];
    creationType?: 'directory' | 'note';
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
                                                                        isOpen, onClose, onSubmit, folderName, setFolderName, parentId, setParentId, treeData, creationType = 'directory'
                                                                    }) => {
    const isNote = creationType === 'note';
    const title = isNote ? "Invocation d'un Parchemin" : "Invocation d'un Grimoire";
    const placeholder = isNote ? "Titre de la note..." : "Nom du dossier...";
    const buttonLabel = isNote ? "Créer la Note" : "Créer le Dossier";
    const icon = isNote ? "🪶" : "📖";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="modal-content"
                    >
                        <h3 className="modal-title">{icon} {title}</h3>
                        <form onSubmit={onSubmit}>
                            <div className="modal-field">
                                <label>Nom :</label>
                                <input
                                    autoFocus
                                    className="modal-input"
                                    type="text"
                                    placeholder={placeholder}
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                />
                            </div>

                            <div className="modal-field">
                                <label>Emplacement (Parent) :</label>
                                <select
                                    className="modal-select"
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value)}
                                >
                                    <option value="root">-- Racine (Défaut) --</option>
                                    {treeData.map((node) => (
                                        <option key={node.id} value={node.id}>
                                            {node.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={onClose} className="btn-cancel">
                                    Annuler
                                </button>
                                <button type="submit" className="btn-confirm">
                                    {buttonLabel}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODALE DE RENOMMAGE ---
interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    value: string;
    setValue: (val: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
                                                            isOpen, onClose, onSubmit, value, setValue
                                                        }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="modal-content"
                    >
                        <h3 className="modal-title">🖋️ Renommer</h3>
                        <form onSubmit={onSubmit}>
                            <div className="modal-field">
                                <label>Nouveau nom :</label>
                                <input
                                    autoFocus
                                    className="modal-input"
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={onClose} className="btn-cancel">Annuler</button>
                                <button type="submit" className="btn-confirm">Valider</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODALE DE SUPPRESSION ---
interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
                                                            isOpen, onClose, onConfirm
                                                        }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="modal-content danger"
                    >
                        <h3 className="modal-title">🔥 Destruction Définitive</h3>
                        <p>Êtes-vous certain de vouloir brûler ce contenu ? Cette action est irréversible.</p>
                        <div className="modal-actions">
                            <button onClick={onClose} className="btn-cancel">Non, garder</button>
                            <button onClick={onConfirm} className="btn-danger" style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                                Oui, détruire
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODALE D'EXPORTATION ---
interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (format: 'zip' | 'pdf') => void;
    folderName?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
                                                            isOpen, onClose, onConfirm, folderName
                                                        }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="modal-content"
                    >
                        <h3 className="modal-title">📦 Exporter {folderName ? `"${folderName}"` : "le Grimoire"}</h3>
                        <p>Sous quelle forme souhaitez-vous matérialiser ces connaissances ?</p>
                        <div className="modal-actions export-actions">
                            <button onClick={() => onConfirm('zip')} className="btn-confirm">
                                📚 Archive ZIP
                            </button>
                            <button onClick={() => onConfirm('pdf')} className="btn-confirm">
                                📜 Document PDF
                            </button>
                        </div>
                        <button onClick={onClose} className="btn-cancel" style={{ marginTop: 10, width: '100%' }}>
                            Annuler
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};