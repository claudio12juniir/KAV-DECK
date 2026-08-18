import { emitInvalidacao } from "../realtime/index.js";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Normaliza "/api/v1/vendas/pedidos/3f2c.../faturar?x=1" para
// "/vendas/pedidos/:id/faturar" — os segmentos variáveis (uuid ou número)
// viram ":id" pra que o cliente possa comparar por prefixo contra a rota de
// listagem/detalhe que ele já usa (ex.: cliente em "/vendas/pedidos" recebe
// o evento acima porque ele começa com o mesmo prefixo).
export function normalizePath(originalUrl) {
  const semQuery = originalUrl.split("?")[0];
  const semPrefixo = semQuery.startsWith("/api/v1") ? semQuery.slice("/api/v1".length) : semQuery;

  return semPrefixo
    .split("/")
    .map((segmento) => (UUID_RE.test(segmento) || /^\d+$/.test(segmento) ? ":id" : segmento))
    .join("/");
}

// Aplicado uma única vez, globalmente, depois do router (src/app.js) — não
// exige tocar em nenhum dos módulos de domínio. Qualquer mutação
// bem-sucedida (2xx) num endpoint autenticado dispara um evento de
// invalidação pra sala da empresa de quem fez a requisição.
export function realtimeInvalidate(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) return next();

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    if (!req.user?.empresaId) return;

    emitInvalidacao({
      empresaId: req.user.empresaId,
      resource: normalizePath(req.originalUrl),
      method: req.method,
      exceptSocketId: req.headers["x-socket-id"] || undefined,
    });
  });

  next();
}
