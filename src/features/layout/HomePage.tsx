
import React from "react";
import "./HomePage.css";

interface HomePageProps {
    user: string;
    onCreateFolder: () => void;
    onOpenRecent: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onCreateFolder, onOpenRecent }) => {
    return (
        <div className="home-container">
            <h1 className="home-title">
                🎃 Bienvenue {user} sur <span className="grimoire">The Lost Grimoire</span>
            </h1>

            <div className="home-buttons">
                <button className="halloween-btn" onClick={onCreateFolder}>
                    📁 Créer un dossier
                </button>

                <button className="halloween-btn" onClick={onOpenRecent}>
                    📂 Ouvrir dossier récent
                </button>
            </div>
        </div>
    );
};

export default HomePage;
