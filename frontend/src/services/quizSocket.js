import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

let socket;

export function getQuizSocket() {
  const token = localStorage.getItem("rankup_token");

  if (socket?.connected && socket.auth?.token === token) return socket;

  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function joinQuizSocketRoom(code) {
  return emitQuizEvent("quiz:join", { code });
}

export function startQuizSocketRoom(code) {
  return emitQuizEvent("quiz:start", { code });
}

export function submitQuizSocketAnswers(code, answers) {
  return emitQuizEvent("quiz:submit", { code, answers });
}

export function finishQuizSocketRoom(code) {
  return emitQuizEvent("quiz:finish", { code });
}

function emitQuizEvent(event, payload) {
  return new Promise((resolve, reject) => {
    const activeSocket = getQuizSocket();
    activeSocket.emit(event, payload, (response = {}) => {
      if (!response.ok) {
        reject(new Error(response.error || "Quiz room action failed."));
        return;
      }
      resolve(response);
    });
  });
}
