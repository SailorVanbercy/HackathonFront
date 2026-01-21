import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar, { type SidebarHandle } from '../../components/SideBar/sidebar';
import { useAuth, useUser } from '../../context/AuthContext';
import { getAllNotes, type NoteTreeItemDTO } from '../../services/notes/noteService';
import { Ghost } from "../../components/Ghost/Ghost";
import { Bats } from "../../components/Bats/Bats";
import './HomePage.css';
import {useNavigate} from "react-router";

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
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    };

    const getRecencyLabel = (note: NoteDisplay) => {
        const date = note.updatedAt ? new Date(note.updatedAt) : new Date(note.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 0) return { label: "Aujourd'hui", icon: "🌙" };
        if (diffDays === 1) return { label: "Hier", icon: "🔮" };
        return { label: formatDate(note.updatedAt || note.createdAt), icon: "🕯️" };
    };

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
            </main>
        </div>
    );
};

export default HomePage;