import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GiQuill, GiTrashCan, GiShare, GiFiles } from 'react-icons/gi';

interface ContextMenuProps {
    x: number;
    y: number;
    targetId: string | null;
    targetType: 'directory' | 'note' | null;
    onClose: () => void;
    onRename: (id: string) => void;
    onDelete: (id: string) => void;
    onExport: (id: string) => void;
    onNewFolder: (parentId: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
                                                            x, y, targetId, targetType, onClose, onRename, onDelete, onExport, onNewFolder
                                                        }) => {
    const menuRef = useRef<HTMLDivElement>(null);

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
            if (e.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!targetId) return null;

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
                    minWidth: '150px'
                }}
            >
                {/* On affiche "Nouveau Dossier" uniquement si on a fait clic-droit sur un dossier */}
                {targetType === 'directory' && (
                    <MenuButton
                        onClick={() => onNewFolder(targetId)}
                        icon={<GiFiles />}
                        label="Nouveau Dossier"
                    />
                )}

                <MenuButton onClick={() => onRename(targetId)} icon={<GiQuill />} label="Renommer" />
                <MenuButton onClick={() => onExport(targetId)} icon={<GiShare />} label="Exporter" />

                <div style={{ height: '1px', background: '#5c0a61', margin: '4px 0' }} />

                <MenuButton onClick={() => onDelete(targetId)} icon={<GiTrashCan />} label="Jeter au feu" danger />
            </motion.div>
        </AnimatePresence>
    );
};

// --- CORRECTION DU TYPE ANY ---
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
            width: '100%'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#4b0050'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
        {icon} {label}
    </button>
);