import { useRef } from 'react';
import Sidebar, { type SidebarHandle } from '../../components/SideBar/sidebar';
import { useAuth } from '../../context/AuthContext';
import './HomePage.css';
import {Ghost} from "../../components/Ghost/Ghost.tsx";
import {Bats} from "../../components/Bats/Bats.tsx";

export const HomePage = () => {
    // 1. Référence vers la Sidebar pour ouvrir la modale
    const sidebarRef = useRef<SidebarHandle>(null);

    // 2. Hook d'authentification pour le logout
    const { logout } = useAuth();

    // 3. Fonction pour déclencher l'ouverture du menu "Nouveau Dossier" via la Sidebar
    const handleNewGrimoire = () => {
        if (sidebarRef.current) {
            sidebarRef.current.openCreateModal();
        }
    };

    return (
        <div className="home-root">
            <Ghost/>
            <Bats/>
            {/* La Sidebar avec la ref attachée */}
            <Sidebar ref={sidebarRef} />

            <main className="main-area">
                {/* --- DÉCORATION D'ARRIÈRE-PLAN --- */}
                <div className="bg-orb orb-1" />
                <div className="bg-orb orb-2" />

                {/* --- TITRE --- */}
                <div className="hero-center">
                    <h1 className="home-title">
                        Bienvenue, <span className="grimoire">Voyageur</span>
                    </h1>
                </div>

                {/* --- ACTIONS PRINCIPALES --- */}
                <div className="main-actions">
                    {/* Bouton Nouveau Grimoire (Connecté à la Sidebar) */}
                    <button
                        className="halloween-btn"
                        onClick={handleNewGrimoire}
                    >
                        ✨ Nouveau Grimoire
                    </button>

                    {/* Bouton Logout (Connecté au AuthContext) */}
                    <button
                        className="halloween-btn"
                        onClick={logout}
                        style={{ borderColor: '#dc3545', color: '#ffb3b3' }}
                    >
                        💀 Se déconnecter
                    </button>
                </div>

                {/* --- SECTION CARTES --- */}
                <section className="recent-section">
                    <h2 className="section-title">Vos écrits récents</h2>

                    <div className="cards-grid">
                        <div className="spooky-card">
                            <div className="card-header">
                                <span>Aujourd'hui</span>
                                <span>🌙</span>
                            </div>
                            <h3>Notes du Crépuscule</h3>
                            <p>Une ébauche de sortilège pour invoquer la pluie...</p>
                        </div>

                        <div className="spooky-card">
                            <div className="card-header">
                                <span>Hier</span>
                                <span>🔮</span>
                            </div>
                            <h3>Potions Interdites</h3>
                            <p>Ingrédients : Racine de mandragore, bave de crapaud...</p>
                        </div>

                        <div className="spooky-card">
                            <div className="card-header">
                                <span>Semaine dernière</span>
                                <span>🕯️</span>
                            </div>
                            <h3>Rituels Anciens</h3>
                            <p>Ne pas oublier d'allumer les bougies dans le sens anti-horaire.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default HomePage;