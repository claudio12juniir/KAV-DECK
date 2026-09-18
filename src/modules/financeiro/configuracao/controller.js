import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const obter = asyncHandler(async (req, res) => {
  const configuracao = await service.obter({ empresaId: req.user.empresaId });
  res.json(configuracao);
});

export const atualizar = asyncHandler(async (req, res) => {
  const configuracao = await service.atualizar({
    empresaId: req.user.empresaId,
    contaBancariaPadraoBoletoId: req.body.contaBancariaPadraoBoletoId,
  });
  res.json(configuracao);
});
