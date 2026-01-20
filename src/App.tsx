import { useState, useEffect } from 'react';
import './App.css';
import LoginPage from "./features/layout/login/LoginPage.tsx";
import { Route, Routes } from "react-router";
import RegisterPage from "./features/layout/register/RegisterPage.tsx";
import HomePage from "./features/layout/home/HomePage.tsx";
import Footer from "./features/components/Footer/Footer.tsx";
import { GiTorch } from "react-icons/gi";

function App() {
    // --- États pour la Torche ---
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        // Met à jour la position X/Y
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        // Détecte quand on clique (pour l'animation)
        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        // Ajout des écouteurs
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        // Nettoyage
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div className="app">
            {/* 1. LE HALO DE LUMIÈRE (Lueur d'ambiance) */}
            <div
                className="torch-cursor"
                style={{
                    left: mousePos.x,
                    top: mousePos.y
                }}
            />

            {/* 2. L'OBJET TORCHE (Remplace le curseur) */}
            <div
                style={{
                    position: 'fixed',
                    left: mousePos.x,
                    top: mousePos.y,
                    pointerEvents: 'none',
                    zIndex: 999999,
                    color: '#ffaa00',
                    fontSize: '2rem',
                    // Animation du "coup" de torche au clic
                    transform: `translate(-20%, -20%) rotate(${isClicking ? '-45deg' : '-15deg'}) scale(${isClicking ? 0.9 : 1})`,
                    transition: 'transform 0.1s ease',
                    filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))'
                }}
            >
                <GiTorch />
            </div>


            <Routes>
                <Route
                    path={"/login"}
                    element={<LoginPage />}
                />
                <Route
                    path={"/register"}
                    element={<RegisterPage />}
                />
                <Route
                    path={"/home"}
                    element={
                        <HomePage
                            user={""}
                            onCreateFolder={() => console.log("Créer dossier")}
                            onOpenRecent={() => console.log("Ouvrir récent")}
                        />
                    }
                />
                <Route
                    path={"/"}
                    element={<LoginPage/>}
                ></Route>
            </Routes>

            <Footer />
        </div>
    );
}

export default App;