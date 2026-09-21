import { auditarAtualizacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

const ENTIDADE = "configuracao-financeira";

export const obter = asyncHandler(async (req, res) => {
  const configuracao = await service.obter({ empresaId: req.user.empresaId });
  res.json(configuracao);
});

// Configuração é 1 registro por empresa (campo da própria Empresa, sem id
// próprio) — usa o empresaId como entidadeId do histórico.
export const atualizar = asyncHandler(async (req, res) => {
  const antes = await service.obter({ empresaId: req.user.empresaId });
  const configuracao = await service.atualizar({
    empresaId: req.user.empresaId,
    contaBancariaPadraoBoletoId: req.body.contaBancariaPadraoBoletoId,
  });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: req.user.empresaId,
    usuarioId: req.user.id,
    antes,
    depois: configuracao,
  });
  res.json(configuracao);
});
