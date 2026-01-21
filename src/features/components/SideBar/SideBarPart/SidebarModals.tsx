import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TreeNode } from "./sidebarTypes";

// --- WRAPPER UNIVERSEL ---
const ModalWrapper: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}> = ({ isOpen, onClose, children, className = "modal-content" }) => {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown, { capture: true });
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={className}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODALE DE CRÉATION (Dossier OU Note) ---
interface CreateFolderModalProps {
    isOpen: boolean; onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    folderName: string; setFolderName: (val: string) => void;
    parentId: number | null;
    setParentId: (val: number | null) => void;
    treeData: TreeNode[]; creationType?: 'directory' | 'note';
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
                                                                        isOpen, onClose, onSubmit, folderName, setFolderName, parentId, setParentId, treeData, creationType = 'directory'
                                                                    }) => {
    const isNote = creationType === 'note';
    const title = isNote ? "Invocation d'un Parchemin" : "Invocation d'un Grimoire";
    const placeholder = isNote ? "Titre de la note..." : "Nom du dossier...";
    const buttonLabel = isNote ? "Créer la Note" : "Créer le Dossier";
    const icon = isNote ? "🪶" : "📖";

    const currentSelectValue = parentId ? `dir-${parentId}` : "root";

    const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === "root") {
            setParentId(null);
        } else {
            const num = Number(val.replace("dir-", "").replace("note-", ""));
            setParentId(isNaN(num) ? null : num);
        }
    };

    // --- CORRECTION : Fonction récursive pour afficher les sous-dossiers ---
    const renderDirectoryOptions = (nodes: TreeNode[], depth = 0): React.ReactNode[] => {
        let options: React.ReactNode[] = [];

        nodes.forEach(node => {
            // On ne veut afficher que les DOSSIERS comme parents possibles
            if (node.type === 'directory') {
                // On ajoute des espaces insécables (\u00A0) pour l'indentation visuelle
                const prefix = "\u00A0\u00A0\u00A0".repeat(depth);

                options.push(
                    <option key={node.id} value={node.id}>
                        {prefix}{depth > 0 ? "└─ " : ""}{node.name}
                    </option>
                );

                // Si le dossier a des enfants, on rappelle la fonction (récursion)
                if (node.children && node.children.length > 0) {
                    options = [...options, ...renderDirectoryOptions(node.children, depth + 1)];
                }
            }
        });

        return options;
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <h3 className="modal-title">{icon} {title}</h3>
            <form onSubmit={onSubmit} className="modal-body">
                <div>
                    <label className="modal-label">Nom :</label>
                    <input
                        autoFocus
                        className="magic-input"
                        type="text"
                        placeholder={placeholder}
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="modal-label">Emplacement (Parent) :</label>
                    <select
                        className="magic-select"
                        value={currentSelectValue}
                        onChange={handleParentChange}
                    >
                        <option value="root">-- Racine (Défaut) --</option>
                        {/* Appel de la fonction récursive ici */}
                        {renderDirectoryOptions(treeData)}
                    </select>
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
                    <button type="submit" className="btn-magic">{buttonLabel}</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

// --- MODALE DE RENOMMAGE (Inchangée) ---
interface RenameModalProps {
    isOpen: boolean; onClose: () => void; onSubmit: (e: React.FormEvent) => void;
    value: string; setValue: (val: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onSubmit, value, setValue }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <h3 className="modal-title">🖋️ Renommer</h3>
            <form onSubmit={onSubmit} className="modal-body">
                <div>
                    <label className="modal-label">Nouveau nom :</label>
                    <input autoFocus className="magic-input" type="text" value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
                    <button type="submit" className="btn-magic">Valider</button>
                </div>
            </form>
        </ModalWrapper>
    );
};

// --- MODALE DE SUPPRESSION (Inchangée) ---
interface DeleteModalProps {
    isOpen: boolean; onClose: () => void; onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} className="modal-content danger">
            <h3 className="modal-title" style={{color: '#ef4444', backgroundImage: 'none', WebkitTextFillColor: 'initial'}}>
                🔥 Destruction Définitive
            </h3>
            <div className="modal-body">
                <p style={{lineHeight: '1.6'}}>Êtes-vous certain de vouloir brûler ce contenu ?<br/>Cette action est <strong style={{color: '#ef4444'}}>irréversible</strong>.</p>
            </div>
            <div className="modal-actions">
                <button onClick={onClose} className="btn-ghost">Non, garder</button>
                <button onClick={onConfirm} className="btn-magic" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}>
                    Oui, détruire
                </button>
            </div>
        </ModalWrapper>
    );
};

// --- MODALE D'EXPORTATION (Inchangée) ---
interface ExportModalProps {
    isOpen: boolean; onClose: () => void; onConfirm: (format: 'zip' | 'pdf') => void; folderName?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onConfirm, folderName }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <h3 className="modal-title">📦 Exporter {folderName ? `"${folderName}"` : "le Grimoire"}</h3>
            <div className="modal-body">
                <p>Sous quelle forme souhaitez-vous matérialiser ces connaissances ?</p>

                <div className="export-options">
                    <div className="export-card" onClick={() => onConfirm('zip')}>
                        <div className="export-icon">📚</div>
                        <div className="export-info">
                            <h4>Archive ZIP</h4>
                            <p>Markdown + Images</p>
                        </div>
                    </div>
                    <div className="export-card" onClick={() => onConfirm('pdf')}>
                        <div className="export-icon">📜</div>
                        <div className="export-info">
                            <h4>Document PDF</h4>
                            <p>Format lecture imprimable</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-actions">
                <button onClick={onClose} className="btn-ghost" style={{width: '100%'}}>Annuler</button>
            </div>
        </ModalWrapper>
    );
};