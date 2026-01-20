import { motion } from 'framer-motion';

export const Ghost = () => {
    return (
        <motion.div
            style={{
                position: 'fixed',
                top: '20%',
                left: '-100px', // Commence hors écran
                zIndex: 0, // Derrière le texte mais devant le fond
                pointerEvents: 'none', // On peut cliquer au travers
                opacity: 0.6
            }}
            animate={{
                x: ['-10vw', '110vw'], // Traverse tout l'écran
                y: [0, -50, 20, -30, 0], // Flotte de haut en bas
                rotate: [0, 5, -5, 0]
            }}
            transition={{
                duration: 15, // Prend 15 secondes pour traverser
                repeat: Infinity,
                repeatDelay: 10, // Attend 10s avant de revenir
                ease: "linear"
            }}
        >
            {/* SVG du Fantôme */}
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C7.58172 2 4 5.58172 4 10V22L6.66667 20L9.33333 22L12 20L14.6667 22L17.3333 20L20 22V10C20 5.58172 16.4183 2 12 2Z" fill="rgba(200, 200, 255, 0.8)"/>
                <circle cx="9" cy="9" r="1.5" fill="#330033"/>
                <circle cx="15" cy="9" r="1.5" fill="#330033"/>
            </svg>
            <div style={{
                color: 'rgba(200, 200, 255, 0.6)',
                textAlign: 'center',
                fontSize: '12px',
                fontFamily: 'Cinzel, serif'
            }}>
                Oouuuh...
            </div>
        </motion.div>
    );
};