import React from "react";
import "./HomePage.css";
import Sidebar from "../components/sidebar"; // Import du nouveau composant

interface HomePageProps {
    user: string;
    onCreateFolder: () => void;
    onOpenRecent: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onCreateFolder, onOpenRecent }) => {
    return (
        <div className="home-root">
            {/* ----- Titre fixe en haut ----- */}
            <div className="hero-center" aria-hidden="true">
                <h1 className="home-title">
                    🎃 Bienvenue {user} sur <span className="grimoire">The Lost Grimoire</span>
                </h1>
            </div>

            {/* ----- Sidebar séparée ----- */}
            <Sidebar />

            {/* ----- Zone principale ----- */}
            <main className="main-area">
                <h1 className="sr-only">Bienvenue {user} sur The Lost Grimoire</h1>

                <div className="main-actions" role="group" aria-label="Actions principales">
                    <button className="halloween-btn" onClick={onCreateFolder}>
                        📁 Créer un dossier
                    </button>
                    <button className="halloween-btn" onClick={onOpenRecent}>
                        🗂️ Ouvrir dossier récent
                    </button>
                </div>
            </main>
        </div>
    );
};

export default HomePage;