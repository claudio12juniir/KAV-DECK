import { getSessionId } from "./sessionId.js";
import { getSocketId } from "./socketClient.js";
import { supabase } from "./supabaseClient.js";

// No app desktop (Electron), a URL do backend é injetada em runtime pelo
// preload (window.__KAV_DESKTOP_API_URL__), lida de uma config local —
// assim o instalador não precisa ser regerado se o host do backend mudar.
// No navegador comum, cai no valor definido em build-time pelo Vite.
const BASE_URL = globalThis.__KAV_DESKTOP_API_URL__ || import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, query } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // BASE_URL pode ser um caminho relativo em produção (ex.: "/api/v1"), que
  // o construtor de URL só aceita com uma base explícita.
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  // Identifica o socket de quem fez a requisição para que o servidor não
  // ecoe de volta o evento de invalidação da própria mutação que este
  // fetch acabou de causar (ver src/middlewares/realtimeInvalidate.js).
  const socketId = getSocketId();
  const sessionId = getSessionId();

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(socketId ? { "X-Socket-Id": socketId } : {}),
        ...(sessionId ? { "X-Session-Id": sessionId } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Falha de rede (servidor fora do ar, sem conexão etc.) — nunca mostrar
    // o erro técnico do navegador ("Failed to fetch") para o usuário.
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    });
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorInfo = payload?.error ?? {};

    // apiClient é um módulo puro (sem acesso a contexto React), então o
    // aviso de sessão encerrada por outro dispositivo sobe como evento do
    // browser — quem trata de verdade (signOut, mensagem na tela) é o
    // AuthContext, que escuta esse evento.
    if (errorInfo.code === "SESSION_REVOKED") {
      window.dispatchEvent(new CustomEvent("kav-session-revoked", { detail: { message: errorInfo.message } }));
    }

    throw new ApiError({
      status: response.status,
      code: errorInfo.code ?? "UNKNOWN_ERROR",
      message: errorInfo.message ?? "Erro inesperado. Tente novamente.",
      details: errorInfo.details,
    });
  }

  return payload;
}

export const apiClient = {
  get: (path, query) => request(path, { method: "GET", query }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
