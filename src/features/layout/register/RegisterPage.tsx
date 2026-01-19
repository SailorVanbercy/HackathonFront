
import { useState } from "react";
import "./RegisterPage.css"
// import { useNavigate, Link } from "react-router-dom";

import type { RegisterRequest } from "../../../shared/DTO/users/users";
import { register } from "../../services/auth/authservice";
import { Link } from "react-router";
// import { useAuth } from "../../context/AuthContext";

type FormState = RegisterRequest & { confirmPassword?: string };

export default function RegisterPage() {
    // const navigate = useNavigate();
    // const { login } = useAuth();

    const [form, setForm] = useState<FormState>({
        name : "",
        firstName : "",
        email : "",
        password: "",
    } as FormState);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        setError(null);
        setSuccess(null);

        // ✅ validations email et mdp
        if (!form.email) return "Email requis.";
        if (!form.password) return "Mot de passe requis.";


        // min length
        if (form.password.length < 6) return "Mot de passe trop court (min 6 caractères).";

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // 1) On prépare l’objet à envoyer (sans confirmPassword)
            const { confirmPassword, ...payload } = form as any;

            // 2) Inscription via ton service
            await register(payload as RegisterRequest);



            // TODO redirection
            // await login({ email: form.email, password: form.password } as any);
            // navigate("/"); // ou "/dashboard"

        } catch (err: any) {
            setError(err?.message ?? "Erreur lors de l'inscription.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="register-page">
            {/* Petit décor / glow */}
            <div className="register-bg-orb register-bg-orb--a" aria-hidden="true" />
            <div className="register-bg-orb register-bg-orb--b" aria-hidden="true" />

            <div className="register-card">
                <header className="register-header">
                    <h1 className="register-title">
                        Créer un <span className="register-title-accent">compte</span>
                    </h1>
                    <p className="register-subtitle">
                        Rejoins le grimoire… et débloque l’accès aux secrets 🎃
                    </p>
                </header>

                {error && (
                    <div className="register-alert register-alert--error" role="alert">
                        <span className="register-alert-icon" aria-hidden="true">⚠</span>
                        <span className="register-alert-text">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="register-alert register-alert--success" role="status">
                        <span className="register-alert-icon" aria-hidden="true">✓</span>
                        <span className="register-alert-text">{success}</span>
                    </div>
                )}

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="register-grid">
                        <div className="register-field">
                            <label className="register-label" htmlFor="firstName">
                                Prénom
                            </label>
                            <input
                                id="firstName"
                                className="register-input"
                                name="firstName"
                                value={(form as any).firstName ?? ""}
                                onChange={handleChange}
                                autoComplete="given-name"
                                placeholder="ex: Warrior 3000"
                            />
                        </div>

                        <div className="register-field">
                            <label className="register-label" htmlFor="lastName">
                                Nom
                            </label>
                            <input
                                id="name"
                                className="register-input"
                                name="name"
                                value={(form as any).name ?? ""}
                                onChange={handleChange}
                                autoComplete="family-name"
                                placeholder="ex: Petit Poney"
                            />
                        </div>

                        <div className="register-field register-field--full">
                            <label className="register-label" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                className="register-input"
                                type="email"
                                name="email"
                                value={(form as any).email ?? ""}
                                onChange={handleChange}
                                autoComplete="email"
                                placeholder="ex: mail@exemple.com"
                            />
                        </div>

                        <div className="register-field">
                            <label className="register-label" htmlFor="password">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                className="register-input"
                                type="password"
                                name="password"
                                value={(form as any).password ?? ""}
                                onChange={handleChange}
                                autoComplete="new-password"
                                placeholder="••••••••"
                            />
                            <p className="register-hint">Min. 6 caractères</p>
                        </div>

                        <div className="register-field">
                            <label className="register-label" htmlFor="confirmPassword">
                                Confirmer
                            </label>
                            <input
                                id="confirmPassword"
                                className="register-input"
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword ?? ""}
                                onChange={handleChange}
                                autoComplete="new-password"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button className="register-btn" type="submit" disabled={isSubmitting}>
                        <span className="register-btn-glow" aria-hidden="true" />
                        {isSubmitting ? "Création..." : "Créer mon compte"}
                    </button>

                    <div className="register-footer">
                        <p className="register-footer-text">
                            Déjà un compte ? <Link className="register-footer-link" to="/login">Connexion</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );

}
