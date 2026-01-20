import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../features/context/AuthContext";

export const RequireAuth = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#ffaa00",
                fontSize: "1.5rem",
                background: "#1a051a"
            }}>
                Invocation en cours... 🔮
            </div>
        );
    }
    // Si pas de user, ALORS on redirige vers login
    return user ? <Outlet /> : <Navigate to="/login" replace />;
};