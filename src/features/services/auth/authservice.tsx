import type {
    LoginRequest,
    RegisterRequest,
    RegisterUserResponse,
    UserResponse
} from "../../../shared/DTO/users/users.ts";

const API_URL =import.meta.env.VITE_API_URL + "/auth";
export const login = async (user : LoginRequest) : Promise<void> => {
    const response =await fetch(API_URL + "/login", {
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user),
        credentials: "include"
    });
    if(!response.ok){
        throw new Error("Erreur de connexion");
    }
}

export const register = async (user : RegisterRequest): Promise<RegisterUserResponse> => {
    const response = await fetch(API_URL + "/register", {
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user),
        credentials: "include"
    });
    if(!response.ok){
        throw new Error("Erreur lors de la création du compte");
    }
    return response.json();
}

export const getCurrentUser = async () : Promise<UserResponse> => {
    const response = await fetch(API_URL + "/me", {
        method: "GET",
        headers:{
            "Content-Type": "application/json"
        },
        credentials: "include"
    });
    if(!response.ok){
        throw new Error("Erreur lors de la récupération des données utilisateur");
    }
    return response.json();
}