import { listarLogs, listarUltimasPorEntidade } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const { entidade, entidadeId } = req.query;
  const logs = await listarLogs({ empresaId: req.user.empresaId, entidade, entidadeId });
  res.json({ items: logs });
});

export const listUltimas = asyncHandler(async (req, res) => {
  const { entidade } = req.query;
  const entidadeIds = req.query.ids.split(",").filter(Boolean);
  const mapa = await listarUltimasPorEntidade({ empresaId: req.user.empresaId, entidade, entidadeIds });
  res.json({ itens: mapa });
});
