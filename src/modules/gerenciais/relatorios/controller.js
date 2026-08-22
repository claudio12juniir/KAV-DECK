import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const vendasPorCliente = asyncHandler(async (req, res) => {
  const items = await service.vendasPorCliente({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});

export const vendasPorProduto = asyncHandler(async (req, res) => {
  const items = await service.vendasPorProduto({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});

export const dre = asyncHandler(async (req, res) => {
  const resultado = await service.dre({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(resultado);
});

export const dfc = asyncHandler(async (req, res) => {
  const resultado = await service.dfc({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(resultado);
});

export const comprasPorFornecedor = asyncHandler(async (req, res) => {
  const items = await service.comprasPorFornecedor({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});

export const resumoFiscal = asyncHandler(async (req, res) => {
  const resultado = await service.resumoFiscal({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(resultado);
});

export const custosColaboradores = asyncHandler(async (req, res) => {
  const resultado = await service.custosColaboradores({ empresaId: req.user.empresaId });
  res.json(resultado);
});

export const relatorioPrincipal = asyncHandler(async (req, res) => {
  const resultado = await service.relatorioPrincipal({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(resultado);
});
