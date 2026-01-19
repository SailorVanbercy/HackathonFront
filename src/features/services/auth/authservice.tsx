import type {LoginRequest, RegisterRequest} from "../../../shared/DTO/users/users.ts";

const API_URL =import.meta.env.VITE_API_URL + "/users";
export const login : (user : LoginRequest) => Promise<void> = async (user : LoginRequest) => {
    const response =  await fetch(API_URL + "/login", {
        method:"POST",
        headers : {
            "Content-Type" :"application/json"
        },
        body : JSON.stringify(user)
    });

    if(!response.ok){

    }
}

export const register : (user : RegisterRequest) => Promise<void> = async (user : RegisterRequest) => {
    return await fetch(API_URL + "/register", {
        method:"POST",
        headers : {
            "Content-Type" :"application/json"
        },
        body : JSON.stringify(user)
    });
}