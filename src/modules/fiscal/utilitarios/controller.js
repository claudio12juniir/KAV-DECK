import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const porCfop = asyncHandler(async (req, res) => {
  const items = await service.porCfop({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});

export const porCfopUf = asyncHandler(async (req, res) => {
  const items = await service.porCfopUf({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});

export const porProduto = asyncHandler(async (req, res) => {
  const items = await service.porProduto({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});
