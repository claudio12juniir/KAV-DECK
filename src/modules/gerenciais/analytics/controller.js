import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const curvaAbcProdutos = asyncHandler(async (req, res) => {
  const items = await service.curvaAbcProdutos({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});

export const curvaAbcClientes = asyncHandler(async (req, res) => {
  const items = await service.curvaAbcClientes({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});

export const curvaAbcFornecedores = asyncHandler(async (req, res) => {
  const items = await service.curvaAbcFornecedores({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items });
});
