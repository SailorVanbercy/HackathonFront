const API_URL = import.meta.env.VITE_API_URL + "/directories";

export interface DirectoryDTO{
    id:number;
    name:string;
    parentDirectoryId:number | 0;
}
export interface GetAllDirectoriesResponse{
    directories:DirectoryDTO[];
}
export interface CreateDirectoryRequest{
    name:string;
    parentDirectoryId : number | null;
}

export const getAllDirectories = async (): Promise<DirectoryDTO[]> => {
    const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include"
    });
    if(!response.ok)throw new Error("Erreur lors de la récupération des dossiers");

    const data : GetAllDirectoriesResponse = await response.json();
    return data.directories;
}

export const createDirectory = async (req : CreateDirectoryRequest) : Promise<DirectoryDTO> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body : JSON.stringify(req),
        credentials: "include"
    });

    if(!response.ok) throw new Error("Erreur lors de la création du grimoire");

    return response.json();
};

export const deleteDirectory = async (id : number) : Promise<void> => {
    await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include"
    });
}