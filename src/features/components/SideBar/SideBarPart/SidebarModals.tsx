import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TreeNode } from './sidebarTypes';
import { type CreationType } from '../hooks/useSidebarModals';

// --- 1. MODALE DE CRÉATION (CORRIGÉE) ---
interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, parentId: number | null, type: CreationType) => void;
    folderName: string;
    setFolderName: (val: string) => void;
    parentId: number | null;
    setParentId: (val: number | null) => void;
    treeData: TreeNode[];
    creationType: CreationType;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
                                                                        isOpen, onClose, onSubmit,
                                                                        folderName, setFolderName,
                                                                        parentId, setParentId,
                                                                        treeData, creationType
                                                                    }) => {

    // Helper pour nettoyer l'ID (ex: "dir-24" -> "24")
    const cleanId = (id: string | number): string => {
        return String(id).replace("dir-", "").replace("note-", "");
    };

    const renderDirectoryOptions = (nodes: TreeNode[], level: number = 0) => {
        return nodes.map((node) => {
            if (node.type !== 'directory') return null;

            // CORRECTION ICI : On utilise l'ID nettoyé pour la value de l'option
            // Cela permet au Select de matcher avec le state parentId (qui est un number)
            const optionValue = cleanId(node.id);

            return (
                <React.Fragment key={node.id}>
                    <option value={optionValue}>
                        {'\u00A0\u00A0\u00A0'.repeat(level)}
                        {level > 0 ? '↳ ' : ''}📁 {node.name}
                    </option>
                    {node.children && node.children.length > 0 &&
                        renderDirectoryOptions(node.children, level + 1)
                    }
                </React.Fragment>
            );
        });
    };

    // Validation
    const isNameValid = folderName.trim().length > 0;
    const isParentValid = creationType !== 'note' || parentId !== null;
    const isValid = isNameValid && isParentValid;

    const handleSubmitClick = () => {
        if (isValid) {
            onSubmit(folderName, parentId, creationType);
        } else {
            console.warn("Tentative de création invalide", { folderName, parentId, creationType });
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <h3 className="modal-title">
                {creationType === 'directory' ? '✨ Nouveau Dossier' : '📜 Nouvelle Note'}
            </h3>

            <div className="modal-body">
                <label className="modal-label">Nom</label>
                <input
                    className="modal-input"
                    autoFocus
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder={creationType === 'directory' ? "Ex: Potions..." : "Ex: Recette..."}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmitClick();
                    }}
                />

                <label className="modal-label" style={{ marginTop: '1rem' }}>Emplacement</label>
                <select
                    className="modal-select"
                    style={{ width: '100%', padding: '8px', background: '#2a0a2e', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
                    // Value est stringifiée pour correspondre aux options
                    value={parentId === null ? '' : String(parentId)}
                    onChange={(e) => {
                        const val = e.target.value;
                        console.log("Sélection brute :", val);

                        if (val === '') {
                            setParentId(null);
                        } else {
                            // Comme on a nettoyé les options, val devrait être "24"
                            // On ajoute une sécu supplémentaire au cas où
                            const cleanedVal = val.replace("dir-", "");
                            const numId = Number(cleanedVal);

                            if (!isNaN(numId)) {
                                console.log("ID converti valide :", numId);
                                setParentId(numId);
                            } else {
                                console.error("ID impossible à convertir :", val);
                            }
                        }
                    }}
                >
                    {/* Option Racine */}
                    {creationType !== 'note' && (
                        <option value="">☁️ Racine (Grimoire)</option>
                    )}

                    {/* Placeholder Note */}
                    {creationType === 'note' && parentId === null && (
                        <option value="" disabled>-- Choisissez un dossier --</option>
                    )}

                    {renderDirectoryOptions(treeData)}
                </select>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Annuler</button>
                    <button
                        className="btn-confirm"
                        disabled={!isValid}
                        style={{
                            opacity: isValid ? 1 : 0.5,
                            cursor: isValid ? 'pointer' : 'not-allowed',
                            border: isValid ? '1px solid #6cd96c' : '1px solid #555'
                        }}
                        onClick={handleSubmitClick}
                    >
                        Créer
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

// --- AUTRES MODALES (Rename, Delete, Export) ---
interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: string, newName: string) => void;
    value: string;
    setValue: (val: string) => void;
}
export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onSubmit, value, setValue }) => (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <h3 className="modal-title">✏️ Renommer</h3>
        <div className="modal-body">
            <input className="modal-input" autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSubmit("", value); }} />
            <div className="modal-actions">
                <button className="btn-cancel" onClick={onClose}>Annuler</button>
                <button className="btn-confirm" onClick={() => onSubmit("", value)}>Valider</button>
            </div>
        </div>
    </ModalWrapper>
);

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}
export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <h3 className="modal-title">🗑️ Suppression</h3>
        <div className="modal-body">
            <p>Êtes-vous sûr de vouloir jeter cela aux oubliettes ?</p>
            <div className="modal-actions">
                <button className="btn-cancel" onClick={onClose}>Annuler</button>
                <button className="btn-confirm btn-danger" onClick={onConfirm}>Supprimer</button>
            </div>
        </div>
    </ModalWrapper>
);

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (format: 'zip' | 'pdf') => void;
    folderName?: string;
}
export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onConfirm, folderName }) => (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <h3 className="modal-title">📦 Exporter {folderName ? `"${folderName}"` : "le Grimoire"}</h3>
        <div className="modal-body">
            <p>Choisissez le format du parchemin :</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                <button className="btn-confirm" onClick={() => onConfirm('zip')}>🗜️ Archive ZIP</button>
                <button className="btn-confirm" onClick={() => onConfirm('pdf')}>📜 Document PDF</button>
                <button className="btn-cancel" onClick={onClose} style={{ width: '100%', marginTop: '10px' }}>Annuler</button>
            </div>
        </div>
    </ModalWrapper>
);

const ModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="modal-overlay" onClick={onClose}>
                <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}>
                    {children}
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);