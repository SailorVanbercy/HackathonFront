import React from "react";
import { GiSpiderWeb, GiHouse } from "react-icons/gi";
import { useNavigate } from "react-router";

interface SidebarHeaderProps {
    search: string;
    setSearch: (val: string) => void;
    isCollapsed: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ search, setSearch }) => {
    const navigate = useNavigate();

    return (
        <div className="sidebar-top" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Ligne du haut : Bouton Maison + Barre de Recherche */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>

                {/* Bouton Home : Juste le logo maison normal */}
                <button
                    onClick={() => navigate("/home")}
                    title="Accueil"
                    style={{
                        flexShrink: 0,
                        width: '38px', /* Taille carrée alignée avec l'input */
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid #5c0a61',
                        borderRadius: '6px',
                        color: '#ff8c00', /* Orange pour rester lisible sur le fond sombre */
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 140, 0, 0.15)';
                        e.currentTarget.style.borderColor = '#ff8c00';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                        e.currentTarget.style.borderColor = '#5c0a61';
                    }}
                >
                    <GiHouse style={{ fontSize: '1.4rem' }} />
                </button>

                {/* Barre de recherche (prend tout l'espace restant) */}
                <div className="search-wrap" style={{ position: 'relative', flex: 1 }}>
                    <span className="search-ico" style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#ff8c00',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }}>
                        <GiSpiderWeb />
                    </span>
                    <input
                        type="text"
                        className="sidebar-search"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
};