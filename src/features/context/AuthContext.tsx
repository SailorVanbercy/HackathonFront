// src/features/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserResponse, LoginRequest } from "../../shared/DTO/users/users";
import { login as loginService, getCurrentUser, logout as logoutService } from "../services/auth/authservice";
import { useNavigate } from "react-router";

// 1. L'interface doit refléter la réalité : l'user PEUT être null (déconnecté)
interface AuthContextType {
    user: UserResponse | null;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    let navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (e) {
                console.error("Non connecté", e);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (data: LoginRequest) => {
        await loginService(data);
        const userData = await getCurrentUser();
        setUser(userData);
    };

    const logout = async () => {
        try {
            await logoutService();
        } catch (e) {
            console.error(e);
        } finally {
            setUser(null);
            navigate('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook de base (peut renvoyer null)
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

// 2. NOUVEAU HOOK : useUser
// À utiliser UNIQUEMENT dans les composants protégés (comme HomePage).
// Il renvoie 'UserResponse' sans null, ce qui facilite le transfert.
export const useUser = (): UserResponse => {
    const { user } = useAuth();
    if (!user) {
        throw new Error("useUser a été appelé sans utilisateur connecté !");
    }
    return user;
};