import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const consultar = asyncHandler(async (req, res) => {
  const grupos = await service.consultar({
    empresaId: req.user.empresaId,
    transportadoraId: req.query.transportadoraId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ items: grupos });
});

export const gerar = asyncHandler(async (req, res) => {
  const faturas = await service.gerar({
    empresaId: req.user.empresaId,
    transportadoraId: req.body.transportadoraId,
    dataInicial: req.body.dataInicial,
    dataFinal: req.body.dataFinal,
  });
  res.status(201).json({ items: faturas });
});
