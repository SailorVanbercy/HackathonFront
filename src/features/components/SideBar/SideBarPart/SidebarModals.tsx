import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TreeNode } from "./sidebarTypes";

// --- Helper pour l'affichage des options du Select ---
const renderDirectoryOptions = (nodes: TreeNode[], depth = 0): React.ReactNode[] => {
    return nodes.flatMap(node => [
        <option key={node.id} value={node.id}>
            {"\u00A0".repeat(depth * 3) + (depth > 0 ? "└ " : "") + node.name}
        </option>,
        ...(node.children ? renderDirectoryOptions(node.children, depth + 1) : [])
    ]);
};

// --- MODALE CRÉATION ---
interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    folderName: string;
    setFolderName: (s: string) => void;
    parentId: string;
    setParentId: (s: string) => void;
    treeData: TreeNode[];
}

export const CreateFolderModal: React.FC<CreateModalProps> = ({
                                                                  isOpen, onClose, onSubmit, folderName, setFolderName, parentId, setParentId, treeData
                                                              }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
                <motion.div className="modal-content" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={e => e.stopPropagation()}>
                    <h3 className="modal-title">🔮 Invocation de Dossier</h3>
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="modal-field">
                            <label>Nom du grimoire</label>
                            <input autoFocus type="text" className="modal-input" value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Ex: Potions..." />
                        </div>
                        <div className="modal-field">
                            <label>Emplacement</label>
                            <select className="modal-select" value={parentId} onChange={e => setParentId(e.target.value)}>
                                <option value="root">✨ Racine</option>
                                {renderDirectoryOptions(treeData)}
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
                            <button type="submit" className="btn-confirm">Invoquer</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- MODALE RENOMMAGE ---
interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    value: string;
    setValue: (s: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onSubmit, value, setValue }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
                <motion.div className="modal-content" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} onClick={e => e.stopPropagation()}>
                    <h3 className="modal-title">🖋️ Réécrire l'Histoire</h3>
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="modal-field">
                            <label>Nouveau nom</label>
                            <input autoFocus type="text" className="modal-input" value={value} onChange={e => setValue(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
                            <button type="submit" className="btn-confirm">Modifier</button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- MODALE SUPPRESSION ---
interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
                <motion.div className="modal-content" style={{ borderColor: '#ff3333', boxShadow: '0 0 25px rgba(255, 50, 50, 0.2)' }} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} onClick={e => e.stopPropagation()}>
                    <h3 className="modal-title" style={{ color: '#ff4d4d' }}>🔥 Condamnation</h3>
                    <p style={{ textAlign: 'center', color: '#e0e0e0', margin: '10px 0' }}>Êtes-vous certain de vouloir bannir ce savoir dans les limbes éternelles ?<br />Action irréversible.</p>
                    <div className="modal-actions" style={{ justifyContent: 'center' }}>
                        <button type="button" className="btn-cancel" onClick={onClose}>Grâce</button>
                        <button type="button" className="btn-confirm" onClick={onConfirm} style={{ background: 'linear-gradient(45deg, #cc0000, #ff0000)', color: 'white' }}>Bannir à jamais</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- NOUVELLE MODALE : EXPORTATION ---
interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (format: 'zip' | 'pdf') => void;
    folderName?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onConfirm, folderName }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="modal-content"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    onClick={e => e.stopPropagation()}
                >
                    <h3 className="modal-title">📦 Matérialisation</h3>

                    <p style={{ textAlign: 'center', color: '#bfaFbF', marginBottom: '16px' }}>
                        Sous quelle forme souhaitez-vous extraire le savoir de <br />
                        <strong style={{ color: '#ff8c00' }}>{folderName || "ce Grimoire"}</strong> ?
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                        {/* Option ZIP */}
                        <motion.button
                            whileHover={{ scale: 1.05, borderColor: '#ff8c00' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onConfirm('zip')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'rgba(255, 140, 0, 0.1)',
                                border: '2px solid #5c0a61',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ffcc99'
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>🤐</span>
                            <span style={{ fontWeight: 'bold' }}>Archive ZIP</span>
                        </motion.button>

                        {/* Option PDF */}
                        <motion.button
                            whileHover={{ scale: 1.05, borderColor: '#ff8c00' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onConfirm('pdf')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'rgba(255, 140, 0, 0.1)',
                                border: '2px solid #5c0a61',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ffcc99'
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>📜</span>
                            <span style={{ fontWeight: 'bold' }}>Grimoire PDF</span>
                        </motion.button>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-cancel" onClick={onClose}>Annuler le rituel</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);