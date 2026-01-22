const API_URL = import.meta.env.VITE_API_URL + "/notes";

// --- DTOs (Data Transfer Objects) ---

export interface NoteTreeItemDTO {
    id: number;
    name: string;
    directoryId: number;
    createdAt: string;
}

export interface NoteDetailDTO {
    id: number;
    userId: number;
    directoryId: number;
    name: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface MetaDataDTO {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    byteSize: number;
    characterCount: number;
    wordCount: number;
    lineCount: number;
}

export interface CreateNoteRequest {
    name: string;
    directoryId: number | null;
}

interface GetAllNotesResponse {
    notes: NoteTreeItemDTO[];
}

export interface UpdateNoteRequest {
    name: string;
    content: string;
}

interface GetNotesByDirResponse {
    notes: { id: number; name: string; createdAt: string }[];
}

// --- APPELS API ---

// 1. RÉCUPÉRATION GLOBALE
export const getAllNotes = async (): Promise<NoteTreeItemDTO[]> => {
    const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok)
        throw new Error("Impossible de rassembler les parchemins (Notes)");

    const data: GetAllNotesResponse = await response.json();
    return data.notes || [];
};

// 2. RÉCUPÉRATION PAR DOSSIER
export const getNotesByDirectory = async (directoryId: number) => {
    const response = await fetch(`${API_URL}/directory/${directoryId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok)
        throw new Error("Erreur lors de la récupération des notes du dossier");

    const data: GetNotesByDirResponse = await response.json();
    return data.notes || [];
};

// 3. RÉCUPÉRATION D'UNE NOTE UNIQUE
export const getNoteById = async (id: number): Promise<NoteDetailDTO> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok) throw new Error("Impossible de lire ce parchemin");

    return response.json();
};

// 4. CRÉATION DE NOTE
export const createNote = async (
    req: CreateNoteRequest,
): Promise<NoteDetailDTO> => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        credentials: "include",
    });

    if (!response.ok) throw new Error("Le rituel de création a échoué");

    return response.json();
};

// 5. MODIFICATION D'UNE NOTE (CORRIGÉ)
// Le serveur renvoie les métadonnées (dates, stats...) après update
export const updateNote = async (
    id: number,
    req: UpdateNoteRequest,
): Promise<MetaDataDTO> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        credentials: "include",
    });

    if (!response.ok) {
        if (response.status === 403)
            throw new Error("Vous n'avez pas le droit de modifier ce parchemin");
        throw new Error("Le sortilège de modification a échoué !");
    }

    // On retourne directement l'objet JSON reçu (MetaDataDTO)
    return await response.json();
};

// 6. SUPPRESSION D'UNE NOTE
export const deleteNote = async (id: number): Promise<void> => {
    await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
};

// 7. RECUPERATION DES METADATA
export const getMetaData = async (id: number): Promise<MetaDataDTO> => {
    const response = await fetch(`${API_URL}/${id}/metadata`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });

    if (!response.ok)
        throw new Error("Erreur lors de la récupération des metadata de la note !");

    return response.json();
};