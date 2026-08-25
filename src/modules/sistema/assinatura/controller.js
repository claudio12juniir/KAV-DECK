import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const dashboard = asyncHandler(async (req, res) => {
  const resultado = await service.obterDashboard({ empresaId: req.user.empresaId });
  res.json(resultado);
});

export const comprarAcesso = asyncHandler(async (req, res) => {
  const resultado = await service.comprarAcesso({ empresaId: req.user.empresaId, ...req.body });
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

export const trocarFormaPagamento = asyncHandler(async (req, res) => {
  const backUrl = `${req.protocol}://${req.get("host")}/`;
  const resultado = await service.trocarFormaPagamento({
    empresaId: req.user.empresaId,
    formaPagamento: req.body.formaPagamento,
    cpf: req.body.cpf,
    endereco: req.body.endereco,
    backUrl,
  });
  res.json(resultado);
});
