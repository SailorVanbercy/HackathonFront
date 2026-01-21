const API_URL = import.meta.env.VITE_API_URL + "/notes";

// --- DTOs (Data Transfer Objects) ---

// Pour l'affichage dans l'arbre (contient directoryId pour savoir où la ranger)
export interface NoteTreeItemDTO {
  id: number;
  name: string;
  directoryId: number;
  createdAt: string;
}

// Pour le détail d'une note (contient le contenu)
export interface NoteDetailDTO {
  id: number;
  userId: number;
  directoryId: number;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Pour la création
export interface CreateNoteRequest {
  name: string;
  directoryId: number | null; // Peut être null si à la racine (selon ton backend)
}

// Interfaces de réponse Backend
interface GetAllNotesResponse {
  notes: NoteTreeItemDTO[];
}

//Interface pour la modification d'une note
export interface UpdateNoteRequest {
  name: string;
  content: string;
}

interface GetNotesByDirResponse {
  notes: { id: number; name: string; createdAt: string }[];
}

// --- APPELS API ---

// 1. RÉCUPÉRATION GLOBALE
// GET /api/notes
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
// GET /api/notes/directory/{directoryId}
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

// 3. RÉCUPÉRATION D'UNE NOTE UNIQUE (Pour l'éditeur)
// GET /api/notes/{id}
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
// POST /api/notes
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

// 5. MODIFICATION D'UNE NOTE
// PUT api/notes/{id}
export const updateNote = async (
  id: number,
  req: UpdateNoteRequest,
): Promise<void> => {
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
};
