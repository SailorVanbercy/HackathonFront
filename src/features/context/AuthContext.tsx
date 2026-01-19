// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type {UserResponse, LoginRequest} from "../../shared/DTO/users/users";
import { login as loginService, getCurrentUser } from "../services/auth/authservice";

interface AuthContextType {
    user: UserResponse | null;
    login: (data: LoginRequest) => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Au chargement de l'app, on vérifie si un cookie existe déjà
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (error) {
                // Pas connecté, ce n'est pas grave
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (data: LoginRequest) => {
        // 1. On fait le login (le cookie est posé)
        await loginService(data);
        // 2. On récupère immédiatement les infos de l'utilisateur
        const userData = await getCurrentUser();
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, login, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};