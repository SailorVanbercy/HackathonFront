// src/features/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserResponse, LoginRequest } from "../../shared/DTO/users/users";
import { login as loginService, getCurrentUser, logout as logoutService } from "../services/auth/authservice";
import { useNavigate } from "react-router";

// 1. The interface reflects the reality: user CAN be null (disconnected)
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
    const navigate = useNavigate();

    // Check authentication status on mount (e.g., page refresh)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (e) {
                // Silent fail: user is just not logged in
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
        // Fetch full user data after successful login to populate state
        const userData = await getCurrentUser();
        setUser(userData);
    };

    const logout = async () => {
        try {
            await logoutService();
        } catch (e) {
            console.error(e);
        } finally {
            // Always clean up state and redirect, even if server logout fails
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

// Basic hook (can return null if used loosely)
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

// 2. NEW HOOK: useUser
// To be used ONLY in protected components (like HomePage).
// It returns 'UserResponse' strictly (non-nullable), simplifying TypeScript usage in views.
export const useUser = (): UserResponse => {
    const { user } = useAuth();
    if (!user) {
        throw new Error("useUser a été appelé sans utilisateur connecté !");
    }
    return user;
};