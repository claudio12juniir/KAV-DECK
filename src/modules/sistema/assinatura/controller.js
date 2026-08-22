import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const dashboard = asyncHandler(async (req, res) => {
  const resultado = await service.obterDashboard({ empresaId: req.user.empresaId });
  res.json(resultado);
});

export const comprarPonto = asyncHandler(async (req, res) => {
  const resultado = await service.comprarPonto({ empresaId: req.user.empresaId });
  res.status(201).json(resultado);
});

export const cancelarPonto = asyncHandler(async (req, res) => {
  const resultado = await service.cancelarPonto({ empresaId: req.user.empresaId, pontoId: req.params.pontoId });
  res.json(resultado);
});

export const trocarCartao = asyncHandler(async (req, res) => {
  const resultado = await service.trocarCartao({
    empresaId: req.user.empresaId,
    cardTokenId: req.body.cardTokenId,
  });
  res.json(resultado);
});
