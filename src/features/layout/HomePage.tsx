import React from "react";
import { motion } from "framer-motion";
import "./HomePage.css";
import Sidebar from "../components/sidebar";

interface HomePageProps {
    user: string;
    onCreateFolder: () => void;
    onOpenRecent: () => void;
}

// Animation de tremblement pour les boutons
const spookyShake = {
    hover: {
        x: [0, -2, 2, -2, 2, 0],
        transition: { duration: 0.4 }
    }
};

const HomePage: React.FC<HomePageProps> = ({ user, onCreateFolder, onOpenRecent }) => {
    return (
        <div className="home-root">
            {/* Décor d'arrière-plan animé */}
            <motion.div
                className="bg-orb orb-1"
                animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="bg-orb orb-2"
                animate={{ y: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Titre fixe */}
            <motion.div
                className="hero-center"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1 className="home-title">
                    🎃 Bienvenue {user} sur <span className="grimoire">The Lost Grimoire</span>
                </h1>
            </motion.div>

            <Sidebar />

            {/* Zone principale avec animation d'entrée */}
            <motion.main
                className="main-area"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="main-actions">
                    <motion.button
                        className="halloween-btn"
                        onClick={onCreateFolder}
                        variants={spookyShake}
                        whileHover="hover"
                        whileTap={{ scale: 0.95 }}
                    >
                        📁 Créer un dossier
                    </motion.button>

                    <motion.button
                        className="halloween-btn"
                        onClick={onOpenRecent}
                        variants={spookyShake}
                        whileHover="hover"
                        whileTap={{ scale: 0.95 }}
                    >
                        🗂️ Ouvrir dossier récent
                    </motion.button>
                </div>
            </motion.main>
        </div>
    );
};

export default HomePage;