import { useNavigate } from "react-router";
import { Ghost } from "../../components/Ghost/Ghost";
import { Bats } from "../../components/Bats/Bats";
import "./NotFound.css";
const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-page">
            {/* Éléments d'ambiance en fond */}
            <Bats />
            <Ghost />

            <div className="fog-container" />

            {/* Contenu principal */}
            <h1 className="not-found-code">404</h1>
            <h2 className="not-found-title">Perdu dans les ténèbres ?</h2>

            <p className="not-found-text">
                Il semblerait que cette page ait été engloutie par le néant.
                Faites attention où vous mettez les pieds... ou la torche.
            </p>

            <button
                className="not-found-btn"
                onClick={() => navigate("/home")}
            >
                Retourner vers la lumière
            </button>
        </div>
    );
};

export default NotFoundPage;