const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

async function apiFetch(url, options = {}) {
  try {
    const token = localStorage.getItem("rankup_token");
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    const response = await fetch(url, options);
    return handleResponse(response);
  } catch (err) {
    if (err.message && !err.message.includes("fetch")) throw err;
    throw new Error(
      "Cannot reach the server. Make sure the backend is running on port 8000 and MongoDB is started."
    );
  }
}

export const checkHealth = async () => {
  const response = await fetch(`${BASE_URL}/health`);
  return handleResponse(response);
};

// ---- Documents ----

export const uploadDocument = async (file, name, folderPath = "/") => {
  const formData = new FormData();
  formData.append("pdf", file);
  if (name) formData.append("name", name);
  if (folderPath) formData.append("folderPath", folderPath);

  return apiFetch(`${BASE_URL}/documents`, {
    method: "POST",
    body: formData,
  });
};

export const listDocuments = async (page = 1, limit = 10, folderPath = "/") => {
  const fp = encodeURIComponent(folderPath || "/");
  return apiFetch(`${BASE_URL}/documents?page=${page}&limit=${limit}&folderPath=${fp}`);
};

export const listFolders = async (path = "/") => {
  const p = encodeURIComponent(path || "/");
  return apiFetch(`${BASE_URL}/documents/folders?path=${p}`);
};

export const createFolder = async (path) => {
  return apiFetch(`${BASE_URL}/documents/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
};

export const deleteFolder = async (path) => {
  const p = encodeURIComponent(path);
  return apiFetch(`${BASE_URL}/documents/folders?path=${p}`, {
    method: "DELETE",
  });
};

export const getDocument = async (id) => {
  return apiFetch(`${BASE_URL}/documents/${id}`);
};

export const renameDocument = async (id, name) => {
  return apiFetch(`${BASE_URL}/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
};

export const deleteDocument = async (id) => {
  return apiFetch(`${BASE_URL}/documents/${id}`, { method: "DELETE" });
};

// ---- Dashboard ----

export const getDashboard = async () => {
  return apiFetch(`${BASE_URL}/dashboard`);
};

// ---- Chat ----

export const askQuestion = async (id, question, answerMode = "document") => {
  return apiFetch(`${BASE_URL}/documents/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answerMode }),
  });
};

// ---- Summary ----

export const getSummary = async (id, regenerate = false) => {
  return apiFetch(`${BASE_URL}/documents/${id}/summary${regenerate ? "?regenerate=true" : ""}`);
};

// ---- Flashcards ----

export const getFlashcards = async (id) => {
  return apiFetch(`${BASE_URL}/documents/${id}/flashcards`);
};

export const generateFlashcards = async (id) => {
  return apiFetch(`${BASE_URL}/documents/${id}/flashcards`, { method: "POST" });
};

export const exportFlashcardsUrl = (id) => `${BASE_URL}/documents/${id}/flashcards/export`;

// ---- Quiz ----

export const getQuiz = async (id) => {
  return apiFetch(`${BASE_URL}/documents/${id}/quiz`);
};

export const generateQuiz = async (id, options = {}) => {
  return apiFetch(`${BASE_URL}/documents/${id}/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
};

export const submitQuizAttempt = async (id, answers) => {
  return apiFetch(`${BASE_URL}/documents/${id}/quiz/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
};

export const exportQuizUrl = (id) => `${BASE_URL}/documents/${id}/quiz/export`;

export const generateQuizFromFolders = async (folders = [], options = {}) => {
  return apiFetch(`${BASE_URL}/documents/quiz/generate-from-folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folders, ...options }),
  });
};

// ---- Tasks ----

export const listTasks = async () => {
  return apiFetch(`${BASE_URL}/tasks`);
};

export const createTask = async (task) => {
  return apiFetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
};

export const updateTask = async (id, updates) => {
  return apiFetch(`${BASE_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
};

export const deleteTask = async (id) => {
  return apiFetch(`${BASE_URL}/tasks/${id}`, { method: "DELETE" });
};

export const createCalendarEvent = async (event) => {
  return apiFetch(`${BASE_URL}/tasks/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
};

export const deleteCalendarEvent = async (id) => {
  return apiFetch(`${BASE_URL}/tasks/events/${id}`, { method: "DELETE" });
};

// ---- Multiplayer Quiz Rooms ----

export const createQuizRoom = async (payload) => {
  return apiFetch(`${BASE_URL}/quiz-rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const joinQuizRoom = async (code) => {
  return apiFetch(`${BASE_URL}/quiz-rooms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
};
