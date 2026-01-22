import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GiQuill, GiTrashCan, GiShare, GiMagicSwirl, GiSpellBook, GiScrollUnfurled } from 'react-icons/gi';

interface ContextMenuProps {
    x: number;
    y: number;
    targetId: string | null;
    targetType: 'directory' | 'note' | null;
    onClose: () => void;
    onRename: (id: string) => void;
    onDelete: (id: string) => void;
    onExport: (id: string) => void;
    onNewFolder: (parentId: string | null) => void;
    onNewNote: (parentId: string | null) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
                                                            x, y, targetId, targetType, onClose, onRename, onDelete, onExport, onNewFolder, onNewNote
                                                        }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [showInvocationSub, setShowInvocationSub] = useState(false);

    // Fermer si on clique ailleurs
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [onClose]);

    // Fermer avec Echap
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // targetId === undefined est géré par le parent (non-rendu), mais on garde une sécu ici
    if (targetId === undefined) return null;

    // Détermine si on est sur un dossier (ou racine) pour afficher l'invocation
    const isDirectoryOrRoot = targetType === 'directory' || targetId === null;

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                    position: 'fixed',
                    top: y,
                    left: x,
                    zIndex: 9999,
                    background: '#1a001a',
                    border: '1px solid #ff8c00',
                    borderRadius: '8px',
                    boxShadow: '0 0 15px rgba(255, 140, 0, 0.3)',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minWidth: '160px'
                }}
            >
                {/* INVOCATION - Uniquement pour dossiers/root */}
                {isDirectoryOrRoot && (
                    <div
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setShowInvocationSub(true)}
                        onMouseLeave={() => setShowInvocationSub(false)}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInvocationSub(!showInvocationSub);
                        }}
                    >
                        <MenuButton
                            onClick={() => {}}
                            icon={<GiMagicSwirl />}
                            label="Invocation"
                        />
                        {/* Sous-menu */}
                        <AnimatePresence>
                            {showInvocationSub && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        top: '-10px', // Léger décalage haut pour facilité
                                        height: '140%', // Zone plus large pour attraper la souris
                                        paddingLeft: '6px', // Le pont invisible !
                                        display: 'flex',
                                        alignItems: 'center', // Centre verticalement par rapport au bouton parent
                                        zIndex: 10
                                    }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        style={{
                                            background: '#2a0a2e',
                                            border: '1px solid #ff8c00',
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            minWidth: '150px',
                                            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        <MenuButton
                                            onClick={() => { onNewFolder(targetId); onClose(); }}
                                            icon={<GiSpellBook />}
                                            label="Nouveau Grimoire"
                                        />
                                        <MenuButton
                                            onClick={() => { onNewNote(targetId); onClose(); }}
                                            icon={<GiScrollUnfurled />}
                                            label="Nouveau Parchemin"
                                        />
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Séparateur */}
                {isDirectoryOrRoot && <div style={{ height: '1px', background: '#5c0a61', margin: '4px 0' }} />}

                {/* Actions contextuelles classiques */}
                {targetId && (
                    <>
                        <MenuButton onClick={() => onRename(targetId)} icon={<GiQuill />} label="Renommer" />
                        <MenuButton onClick={() => onExport(targetId)} icon={<GiShare />} label="Exporter" />
                        <div style={{ height: '1px', background: '#5c0a61', margin: '4px 0' }} />
                        <MenuButton onClick={() => onDelete(targetId)} icon={<GiTrashCan />} label="Jeter au feu" danger />
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

interface MenuButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick, icon, label, danger }) => (
    <button
        onClick={onClick}
        style={{
            background: 'transparent',
            border: 'none',
            color: danger ? '#ff4d4d' : '#ffcc99',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: '4px',
            fontSize: '0.9rem',
            transition: 'background 0.2s',
            width: '100%',
            whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#4b0050'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
        {icon} {label}
    </button>
);