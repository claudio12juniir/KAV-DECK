// Pub-sub mínimo pra comunicação entre módulos que não são componentes React
// (ex.: apiClient avisando sobre 401 SESSION_REVOKED pro AuthContext ouvir).
// React Native não tem `window`/CustomEvent como a web, então isso substitui
// o `window.dispatchEvent` usado no app web pro mesmo propósito.
const listenersPorEvento = new Map();

export function on(evento, callback) {
  if (!listenersPorEvento.has(evento)) listenersPorEvento.set(evento, new Set());
  listenersPorEvento.get(evento).add(callback);
  return () => listenersPorEvento.get(evento)?.delete(callback);
}

export function emit(evento, detalhe) {
  listenersPorEvento.get(evento)?.forEach((callback) => callback(detalhe));
}
