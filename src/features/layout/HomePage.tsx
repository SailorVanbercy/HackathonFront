import React from "react";
import { motion } from "framer-motion";
import "./HomePage.css";
import Sidebar from "../components/sidebar";
import { Bats } from "../components/Bats";
import { Ghost } from "../components/Ghost"; // <--- 1. On n'oublie pas l'import !

interface HomePageProps {
    user: string;
    onCreateFolder: () => void;
    onOpenRecent: () => void;
}

const spookyShake = {
    hover: { x: [0, -2, 2, -2, 2, 0], transition: { duration: 0.4 } }
};

// Données factices
const recentNotes = [
    { id: 1, title: "Recette Potion de Vie", date: "31 Oct", excerpt: "Ingrédients: bave de crapaud..." },
    { id: 2, title: "Rituel de la Lune", date: "30 Oct", excerpt: "Attendre minuit pile..." },
    { id: 3, title: "Liste des victimes", date: "28 Oct", excerpt: "Ne pas oublier Crespin..." },
];

const HomePage: React.FC<HomePageProps> = ({ user, onCreateFolder, onOpenRecent }) => {
    return (
        <div className="home-root">
            {/* --- ZONE DÉCORATIONS --- */}


            <Ghost />
            <Bats />

            <motion.div
                className="bg-orb orb-1"
                animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="bg-orb orb-2"
                animate={{ y: [0, 30, 0], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* --- SIDEBAR --- */}
            <Sidebar />

            {/* --- CONTENU PRINCIPAL --- */}
            <motion.main
                className="main-area"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Titre et Sous-titre */}
                <motion.div
                    className="hero-center"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <h1 className="home-title">
                            🎃 <span className="grimoire">The Lost Grimoire</span>
                        </h1>
                        <p style={{ color: '#aaa', margin: 0, fontSize: '1.1rem', fontFamily: 'Cinzel, serif' }}>
                            Prêt à écrire vos cauchemars {user} ?
                        </p>
                    </div>
                </motion.div>

                {/* Boutons d'action */}
                <div className="main-actions">
                    <motion.button
                        className="halloween-btn"
                        onClick={onCreateFolder}
                        variants={spookyShake}
                        whileHover="hover"
                        whileTap={{ scale: 0.95 }}
                    >
                        📁 Nouveau Grimoire
                    </motion.button>

                    <motion.button
                        className="halloween-btn"
                        onClick={onOpenRecent}
                        variants={spookyShake}
                        whileHover="hover"
                        whileTap={{ scale: 0.95 }}
                    >
                        💀 Ouvrir la Crypte
                    </motion.button>
                </div>

                {/* Dashboard (Cartes) */}
                <div className="recent-section">
                    <h2 className="section-title">Dernières Incantations</h2>
                    <div className="cards-grid">
                        {recentNotes.map((note, i) => (
                            <motion.div
                                key={note.id}
                                className="spooky-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                whileHover={{ scale: 1.05, rotate: 1 }}
                            >
                                <div className="card-header">
                                    <span className="card-icon">📜</span>
                                    <span className="card-date">{note.date}</span>
                                </div>
                                <h3>{note.title}</h3>
                                <p>{note.excerpt}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </motion.main>
        </div>
    );
};

export default HomePage;