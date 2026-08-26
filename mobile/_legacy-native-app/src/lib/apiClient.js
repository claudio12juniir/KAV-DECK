import { emit } from "./eventBus.js";
import { getSessionId } from "./sessionId.js";
import { getSocketId } from "./socketClient.js";
import { supabase } from "./supabaseClient.js";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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

  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  // Identifica o socket e o dispositivo de quem fez a requisição — o
  // primeiro pra evitar eco do próprio evento de invalidação, o segundo
  // pra checagem de sessão única (ver backend: src/middlewares/auth.js e
  // src/middlewares/realtimeInvalidate.js).
  const socketId = getSocketId();
  const sessionId = await getSessionId();

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
    // o erro técnico do fetch pro usuário.
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

    // apiClient é um módulo puro (sem acesso a contexto React) — o aviso de
    // sessão encerrada por outro dispositivo sobe pelo eventBus; quem trata
    // de verdade (signOut, mensagem na tela) é o AuthContext.
    if (errorInfo.code === "SESSION_REVOKED") {
      emit("kav-session-revoked", { message: errorInfo.message });
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
