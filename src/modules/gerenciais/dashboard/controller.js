import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const faturamento = asyncHandler(async (req, res) => {
  const resultado = await service.faturamento({ empresaId: req.user.empresaId, ano: req.query.ano });
  res.json(resultado);
});

export const titulosAnual = asyncHandler(async (req, res) => {
  const resultado = await service.titulosAnual({ empresaId: req.user.empresaId, anos: req.query.anos });
  res.json({ items: resultado });
});
