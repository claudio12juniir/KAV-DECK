import { io } from "socket.io-client";
import { getOrCreateSessionId } from "./sessionId.js";
import { supabase } from "./supabaseClient.js";

// Mesma origem do backend REST (EXPO_PUBLIC_API_URL já inclui "/api/v1";
// o Socket.io escuta na raiz do servidor HTTP, então usamos só a origem).
const API_BASE = process.env.EXPO_PUBLIC_API_URL;
const SOCKET_ORIGIN = new URL(API_BASE).origin;

let socket = null;

export function connectSocket() {
  if (socket) return socket;

  socket = io(SOCKET_ORIGIN, {
    path: "/socket.io",
    // Função (não objeto) pra que cada tentativa de (re)conexão busque o
    // access_token vigente na hora — o Supabase rotaciona esse token
    // periodicamente, e reconectar após uma queda de rede não pode
    // carregar um token antigo já expirado.
    auth: async (cb) => {
      const { data } = await supabase.auth.getSession();
      const sessionId = await getOrCreateSessionId();
      cb({ token: data.session?.access_token, sessionId });
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
