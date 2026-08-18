// Identifica este dispositivo/navegador para a sessão única (ver
// prisma/schema.prisma:SessaoAtiva e src/middlewares/auth.js no backend).
// Fica em localStorage — por design é compartilhado entre abas do mesmo
// navegador (abas = mesmo "dispositivo"), e só muda quando o usuário faz um
// novo login explícito (renewSessionId), nunca só por recarregar a página.
const KEY = "kav-deck:session-id";

function gerar() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSessionId() {
  return localStorage.getItem(KEY);
}

export function getOrCreateSessionId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = gerar();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function renewSessionId() {
  const id = gerar();
  localStorage.setItem(KEY, id);
  return id;
}

export function clearSessionId() {
  localStorage.removeItem(KEY);
}
