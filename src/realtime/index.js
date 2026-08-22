import { Server } from "socket.io";
import { loadUsuarioFromPayload, verifyAccessToken } from "../lib/authToken.js";

// Motor de tempo real: um servidor Socket.io anexado ao mesmo servidor HTTP
// do Express, com uma sala por empresa. O cliente não recebe payloads de
// domínio pelo socket — só um evento de invalidação ("recurso X mudou"), e
// refaz o fetch pela mesma rota REST autorizada que já usava. Isso evita
// duplicar regra de serialização/autorização em dois canais.
export function empresaRoom(empresaId) {
  return `empresa:${empresaId}`;
}

// Sala individual por sessão de dispositivo (não por usuário — um usuário
// só tem uma sessão ativa por vez, mas o socket da aba/dispositivo que
// acabou de perder a sessão precisa de um alvo próprio pra receber o aviso
// de "session-revoked", ver src/modules/auth/me/service.js).
export function sessaoRoom(sessaoId) {
  return `sessao:${sessaoId}`;
}

let io = null;

export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    const { token, sessionId } = socket.handshake.auth ?? {};
    if (!token) return next(new Error("UNAUTHORIZED"));

    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch {
      return next(new Error("UNAUTHORIZED"));
    }

    const usuario = await loadUsuarioFromPayload(payload);
    if (!usuario) return next(new Error("UNAUTHORIZED"));

    socket.data.usuario = usuario;
    socket.data.sessionId = sessionId;
    next();
  });

  io.on("connection", (socket) => {
    socket.join(empresaRoom(socket.data.usuario.empresaId));
    if (socket.data.sessionId) socket.join(sessaoRoom(socket.data.sessionId));
  });

  return io;
}

export function getIO() {
  return io;
}

// Chamado pelo middleware genérico de invalidação (src/middlewares/realtimeInvalidate.js)
// após qualquer mutação bem-sucedida. `exceptSocketId` evita ecoar o evento
// de volta pra quem já sabe que a mutação aconteceu (o próprio autor,
// identificado pelo header X-Socket-Id que o apiClient envia).
export function emitInvalidacao({ empresaId, resource, method, exceptSocketId }) {
  if (!io || !empresaId) return;

  const room = io.to(empresaRoom(empresaId));
  const emitter = exceptSocketId ? room.except(exceptSocketId) : room;

  emitter.emit("invalidate", {
    resource,
    method,
    at: new Date().toISOString(),
  });
}

// Avisa em tempo real o dispositivo que acabou de perder a sessão — tanto
// quando outro login assume a conta (src/modules/auth/me/service.js) quanto
// quando um admin força a revogação (src/modules/sistema/sessoes/service.js).
// O cliente reage encerrando a sessão local (signOut) na hora, sem esperar
// a próxima requisição HTTP tomar 401 SESSION_REVOKED.
export function emitSessaoRevogada(sessaoId, motivo) {
  if (!io || !sessaoId) return;
  io.to(sessaoRoom(sessaoId)).emit("session-revoked", { motivo, at: new Date().toISOString() });
}

// Mesma reação do cliente que emitSessaoRevogada (evento "session-revoked" já
// tratado em AuthContext/RealtimeContext), mas mirando a empresa inteira em
// vez de uma sessão específica — usado só quando o cron
// (src/jobs/assinaturasCron.js) marca a assinatura como SUSPENSA por
// inadimplência: derruba todo mundo, não só quem está prestes a fazer a
// próxima requisição HTTP (que já tomaria 402 ASSINATURA_SUSPENSA sozinha).
export function emitEmpresaSuspensa(empresaId, motivo) {
  if (!io || !empresaId) return;
  io.to(empresaRoom(empresaId)).emit("session-revoked", { motivo, at: new Date().toISOString() });
}
