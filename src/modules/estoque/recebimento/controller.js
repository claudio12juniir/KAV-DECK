import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const consultar = asyncHandler(async (req, res) => {
  const items = await service.consultar({
    empresaId: req.user.empresaId,
    fornecedorId: req.query.fornecedorId,
    produtoId: req.query.produtoId,
    departamentoId: req.query.departamentoId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
    apenasPendente: req.query.apenasPendente,
  });
  res.json({ items });
});
