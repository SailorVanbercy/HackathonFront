import React from "react";
import { GiSpiderWeb, GiHealthNormal } from "react-icons/gi";

interface SidebarHeaderProps {
    search: string;
    setSearch: (val: string) => void;
    isCollapsed: boolean;
    onOpenCreate: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ search, setSearch, isCollapsed, onOpenCreate }) => {
    return (
        <div className="sidebar-top" style={{ flexDirection: 'column', gap: '8px' }}>
            <div className="search-wrap" style={{ width: '100%' }}>
                <span className="search-ico"><GiSpiderWeb /></span>
                <input
                    type="text"
                    className="sidebar-search"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {!isCollapsed && (
                <button
                    onClick={onOpenCreate}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        width: '100%', padding: '6px', background: '#330033',
                        border: '1px solid #ff6600', color: '#ffcc99', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '0.9rem'
                    }}
                >
                    <GiHealthNormal style={{ fontSize: '0.8rem' }} /> Nouveau Grimoire
                </button>
            )}
        </div>
    );
};