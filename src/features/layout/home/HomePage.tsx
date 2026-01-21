import { useRef } from 'react';
import Sidebar, { type SidebarHandle } from '../../components/SideBar/sidebar';
import { useAuth } from '../../context/AuthContext'; //
import './HomePage.css';
import {Ghost} from "../../components/Ghost/Ghost.tsx";
import {Bats} from "../../components/Bats/Bats.tsx";

export const HomePage = () => {
    const sidebarRef = useRef<SidebarHandle>(null);

    // On récupère 'user' en plus de 'logout' pour afficher le prénom
    const { logout, user } = useAuth(); //

    const handleNewGrimoire = () => {
        if (sidebarRef.current) {
            sidebarRef.current.openCreateModal();
        }
    };

    return (
        <div className="home-root">
            <Ghost/>
            <Bats/>
            <Sidebar ref={sidebarRef} />

            <main className="main-area">
                <div className="bg-orb orb-1" />
                <div className="bg-orb orb-2" />

                {/* --- BOUTON DÉCONNEXION (Haut Droite) --- */}
                <div className="top-right-actions">
                    <button
                        className="halloween-btn logout-btn"
                        onClick={logout}
                    >
                        💀 Se déconnecter
                    </button>
                </div>

                {/* --- TITRE --- */}
                <div className="hero-center">
                    <h1 className="home-title">
                        Bienvenue {user?.firstName} sur <span className="grimoire">The Lost Grimoire</span>
                    </h1>
                    <p className="hero-subtitle">Prêt à écrire vos cauchemars ?</p>
                </div>

                {/* --- ACTIONS PRINCIPALES (Juste le Grimoire maintenant) --- */}
                <div className="main-actions">
                    <button
                        className="halloween-btn"
                        onClick={handleNewGrimoire}
                    >
                        ✨ Nouveau Grimoire
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