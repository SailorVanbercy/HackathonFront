
import React, { useState } from "react";
import "./HomePage.css";

interface HomePageProps {
    user: string;
    onCreateFolder: () => void;
    onOpenRecent: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onCreateFolder, onOpenRecent }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="home-root">
            {/* Sidebar */}
            <aside
                className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
                aria-label="Barre latérale"
            >
                <button
                    className="collapse-btn"
                    type="button"
                    onClick={() => setIsCollapsed((s) => !s)}
                    aria-expanded={!isCollapsed}
                    aria-controls="sidebar-content"
                    title={isCollapsed ? "Ouvrir la barre latérale" : "Réduire la barre latérale"}
                >
          <span className="sr-only">
            {isCollapsed ? "Ouvrir la barre latérale" : "Réduire la barre latérale"}
          </span>
                    <span className={`chevron ${isCollapsed ? "right" : "left"}`} />
                </button>

                <div id="sidebar-content" className="sidebar-content">
                    <h2 className="sidebar-title">Mes dossiers</h2>

                    {/* Exemple de contenus statiques – à remplacer par tes données */}
                    <nav className="nav-tree">
                        <button className="nav-item">📁 Projet Halloween</button>
                        <button className="nav-item">📄 Idées d’icônes</button>
                        <button className="nav-item">📁 Cours AMT</button>
                    </nav>

                    <div className="sidebar-actions">
                        <button className="halloween-btn" onClick={onCreateFolder}>
                            📁 Créer un dossier
                        </button>
                        <button className="halloween-btn" onClick={onOpenRecent}>
                            📂 Ouvrir dossier récent
                        </button>
                    </div>
                </div>
            </aside>

            {/* Contenu principal */}
            <main className="main-area">
                <h1 className="home-title">
                    🎃 Bienvenue {user} sur <span className="grimoire">The Lost Grimoire</span>
                </h1>
                <p>Sélectionne un dossier à gauche ou crée-en un pour commencer.</p>
            </main>
        </div>
    );
};

export default HomePage;
