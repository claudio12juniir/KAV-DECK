import { io } from "socket.io-client";
import { getOrCreateSessionId } from "./sessionId.js";
import { supabase } from "./supabaseClient.js";

// Mesma origem do backend REST (VITE_API_URL já inclui "/api/v1"; o
// Socket.io escuta na raiz do servidor HTTP, então usamos só a origem). No
// desktop Electron, a URL da API é injetada em runtime pelo preload — ver
// apiClient.js para o mesmo padrão.
const API_BASE = globalThis.__KAV_DESKTOP_API_URL__ || import.meta.env.VITE_API_URL;
// API_BASE pode ser um caminho relativo em produção (ex.: "/api/v1"), que o
// construtor de URL só aceita com uma base explícita.
const SOCKET_ORIGIN = new URL(API_BASE, window.location.origin).origin;

let socket = null;

export function connectSocket() {
  if (socket) return socket;

  socket = io(SOCKET_ORIGIN, {
    path: "/socket.io",
    // Função (não objeto) para que cada tentativa de (re)conexão busque o
    // access_token vigente na hora — o Supabase rotaciona esse token
    // periodicamente, e um socket que reconecta após uma queda de rede não
    // pode carregar um token antigo já expirado.
    auth: async (cb) => {
      const { data } = await supabase.auth.getSession();
      cb({ token: data.session?.access_token, sessionId: getOrCreateSessionId() });
    },
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}

export function getSocketId() {
  return socket?.connected ? socket.id : undefined;
}
