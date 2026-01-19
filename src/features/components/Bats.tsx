
import { motion } from 'framer-motion';

// Une seule chauve-souris
const Bat = ({ delay, top, duration }: { delay: number, top: string, duration: number }) => (
    <motion.div
        style={{
            position: 'absolute',
            top: top,
            left: '-100px',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: 0.6 // Transparence pour l'effet fantomatique
        }}
        animate={{
            x: ['-10vw', '110vw'], // Traverse l'écran
            y: [0, -40, 0, 40, 0], // Vole en vagues
        }}
        transition={{
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: "linear"
        }}
    >
        {/* CORRECTION ICI : fill="rgba(255, 255, 255, 0.8)" pour le blanc */}
        <svg width="40" height="25" viewBox="0 0 54 33" fill="none">
            <path
                d="M27 12C21 6 12 0 0 12C6 18 10 24 12 33C14 24 20 20 27 24C34 20 40 24 42 33C44 24 48 18 54 12C42 0 33 6 27 12Z"
                fill="rgba(200, 200, 255, 0.9)"
            />
        </svg>
    </motion.div>
);

export const Bats = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            <Bat delay={0} top="15%" duration={12} />
            <Bat delay={5} top="45%" duration={15} />
            <Bat delay={2} top="30%" duration={10} />
            <Bat delay={8} top="60%" duration={18} />
        </div>
    );
};