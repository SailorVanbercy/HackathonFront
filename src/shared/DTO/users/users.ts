export interface LoginRequest{
    email: string;
    password:string;
}
export interface RegisterRequest{
    name:string;
    firstName:string;
    email:string;
    password:string;
}

export interface UserResponse{
    id : number;
    firstName:string;
    lastName:string;
    email:string;
    createdAt : Date;
}
export interface RegisterUserResponse{
    id:number;
    email:string;
}