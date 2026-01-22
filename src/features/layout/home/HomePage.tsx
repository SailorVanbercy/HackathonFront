import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar, { type SidebarHandle } from '../../components/SideBar/sidebar';
import { useAuth, useUser } from '../../context/AuthContext';
import { getAllNotes, type NoteTreeItemDTO } from '../../services/notes/noteService';
import { Ghost } from "../../components/Ghost/Ghost";
import { Bats } from "../../components/Bats/Bats";
import './HomePage.css';
import {useNavigate} from "react-router";
import {useHotkeys} from "react-hotkeys-hook";

interface NoteDisplay extends NoteTreeItemDTO {
    updatedAt?: string;
    content?: string;
}

export const HomePage = () => {
    const navigate = useNavigate();
    const sidebarRef = useRef<SidebarHandle>(null);
    const user = useUser();
    const { logout } = useAuth();

    const [notes, setNotes] = useState<NoteDisplay[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fonction de chargement extraite pour pouvoir être appelée depuis le useEffect ET la Sidebar
    const fetchNotes = async () => {
        try {
            // On peut choisir de remettre isLoading à true ou non selon l'effet visuel désiré
            // Ici on recharge silencieusement si c'est un refresh, sauf si la liste est vide
            if (notes.length === 0) setIsLoading(true);

            const fetchedNotes = await getAllNotes();
            setNotes(fetchedNotes as NoteDisplay[]);
        } catch (err) {
            console.error("Erreur chargement notes", err);
            setError("Impossible d'invoquer vos écrits...");
        } finally {
            setIsLoading(false);
        }
    };

    // Chargement initial
    useEffect(() => {
        fetchNotes();
    }, []);

    const recentNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        }).slice(0, 3);
    }, [notes]);


    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'long',   // ex: "octobre"
            hour: '2-digit', // ex: "14"
            minute: '2-digit' // ex: "30"
        });
    };

    const getRecencyLabel = (note: NoteDisplay) => {
        const date = note.updatedAt ? new Date(note.updatedAt) : new Date(note.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 0) {
            return {
                label: formatDate(note.updatedAt || note.createdAt),
                icon: "🌙"
            };
        }
        if (diffDays === 1) return { label: "Hier", icon: "🔮" };
        return { label: formatDate(note.updatedAt || note.createdAt), icon: "🕯️" };
    };
    const SpookySeparator = () => (
        <div className="spooky-separator">
            <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* --- Brume (Plus claire et plus visible) --- */}
                <path
                    className="fog-layer"
                    d="M0 120 L0 20 Q 300 60 600 20 Q 900 -10 1200 40 L 1200 120 Z"
                    fill="#5D2490" /* Violet plus vif */
                    fillOpacity="0.6" /* Plus opaque */
                />

                {/* Sol principal (Noir profond - Doit correspondre au footer) */}
                <path
                    d="M0 120 L0 80 Q 200 100 400 70 Q 700 30 1200 90 L 1200 120 Z"
                    fill="#1a1a1a"
                />

                {/* --- Décors (Tombes plus claires pour le contraste) --- */}
                <g fill="#333333" stroke="#444444" strokeWidth="1">
                    {/* Croix gauche */}
                    <rect x="150" y="40" width="10" height="40" />
                    <rect x="135" y="50" width="40" height="10" />

                    {/* Pierre tombale centrale */}
                    <path d="M 580 80 L 580 50 A 20 20 0 0 1 620 50 L 620 80 Z" />

                    {/* Croix droite penchée */}
                    <g transform="rotate(10, 950, 60)">
                        <rect x="945" y="30" width="8" height="40" />
                        <rect x="930" y="40" width="38" height="8" />
                    </g>
                </g>

                {/* --- Yeux rouges --- */}
                <g fill="red" filter="drop-shadow(0 0 2px red)" className="blinking-eyes">
                    <circle cx="350" cy="90" r="2" /> <circle cx="358" cy="90" r="2" />
                    <circle cx="800" cy="60" r="1.5" /> <circle cx="806" cy="60" r="1.5" />
                </g>

                {/* --- Citrouille --- */}
                <g transform="translate(1050, 85)">
                    <ellipse cx="15" cy="10" rx="15" ry="12" fill="#FF7518" />
                    <rect x="13" y="-2" width="4" height="6" fill="#4a6741" />
                    <g fill="#FFD700" filter="drop-shadow(0 0 4px #FFD700)" className="candle-flicker">
                        <polygon points="8,6 12,10 4,10" />
                        <polygon points="22,6 26,10 18,10" />
                        <path d="M 8 15 Q 15 20 22 15 L 20 18 Q 15 22 10 18 Z" />
                    </g>
                </g>
            </svg>
        </div>
    );
    return (
        <div className="home-root">
            <Ghost/>
            <Bats/>

            {/* On passe la fonction de refresh à la Sidebar */}
            <Sidebar ref={sidebarRef} onRefresh={fetchNotes} />

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
                        Bienvenue, <span className="grimoire">{user.firstname}</span>
                    </h1>
                    <p className="hero-subtitle">Prêt à écrire vos cauchemars ?</p>
                </div>

                <div className="main-actions"></div>

                <section className="recent-section">
                    <h2 className="section-title">Vos écrits récents</h2>
                    {isLoading ? (
                        <div style={{ color: '#aaa', textAlign: 'center', marginTop: '2rem' }}>Invocation des notes en cours...</div>
                    ) : error ? (
                        <div style={{ color: '#dc3545', textAlign: 'center', marginTop: '2rem' }}>{error}</div>
                    ) : recentNotes.length > 0 ? (
                        <div className="cards-grid">
                            {recentNotes.map((note) => {
                                const { label, icon } = getRecencyLabel(note);
                                return (
                                    <div key={note.id} className="spooky-card" onClick={() => navigate(`/note/${note.id}`)}>
                                        <div className="card-header">
                                            <span>{label}</span>
                                            <span>{icon}</span>
                                        </div>
                                        <h3>{note.name}</h3>
                                        <p>{note.content ? (note.content.substring(0, 60) + "...") : "Contenu mystérieux..."}</p>
                                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 'auto', paddingTop: '10px' }}>
                                            {note.updatedAt ? "Modifié" : "Créé"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ textAlign: 'center', color: '#888' }}>
                            <p>Le grimoire est vide... Commencez par créer une note !</p>
                        </div>
                    )}
                </section>
                <SpookySeparator />
            </main>
        </div>
    );
};

export default HomePage;