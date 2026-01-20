
// src/pages/LoginPage.tsx
import { useState } from "react";
import "./LoginPage.css";

import type { LoginRequest } from "../../../shared/DTO/users/users";
import { useAuth } from "../../context/AuthContext";
import {NavLink, useNavigate} from "react-router";

export default function LoginPage() {
    const { login } = useAuth();
    let navigate = useNavigate();
    const [form, setForm] = useState<LoginRequest>({
        email: "",
        password: "",
    });

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

        if (!form.email) return "Email requis.";
        if (!form.password) return "Mot de passe requis.";

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
            await login(form); // <- utilise ton AuthContext (loginService + getCurrentUser)
            setSuccess("Connexion réussie. Bienvenue dans le grimoire 🎃");
            navigate("/home");
        } catch (err: any) {
            setError(err?.message ?? "Erreur de connexion.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-orb login-bg-orb--a" aria-hidden="true" />
            <div className="login-bg-orb login-bg-orb--b" aria-hidden="true" />

            <div className="login-card">
                <header className="login-header">
                    <h1 className="login-title">
                        Connexion au <span className="login-title-accent">Grimoire</span>
                    </h1>
                    <p className="login-subtitle">
                        Entre ton email et ton mot de passe pour ouvrir le portail…
                    </p>
                </header>

                {error && (
                    <div className="login-alert login-alert--error" role="alert">
                        <span className="login-alert-icon" aria-hidden="true">⚠</span>
                        <span className="login-alert-text">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="login-alert login-alert--success" role="status">
                        <span className="login-alert-icon" aria-hidden="true">✓</span>
                        <span className="login-alert-text">{success}</span>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label className="login-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            className="login-input"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            placeholder="ex: mail@exemple.com"
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="password">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            className="login-input"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            placeholder="••••••••"
                        />
                        <p className="login-hint">Min. 8 caractères</p>
                    </div>

                    <button className="login-btn" type="submit" disabled={isSubmitting}>
                        <span className="login-btn-glow" aria-hidden="true" />
                        {isSubmitting ? "Connexion..." : "Se connecter"}
                    </button>

                    <div className="login-footer">
                        <p className="login-footer-text">
                            Pas encore de compte ? <NavLink to="/register" className="login-footer-link">Inscription</NavLink>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
