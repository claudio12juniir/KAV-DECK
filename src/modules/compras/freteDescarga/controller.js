import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const consultar = asyncHandler(async (req, res) => {
  const resultado = await service.consultar({
    empresaId: req.user.empresaId,
    transportadoraId: req.query.transportadoraId,
  });
  res.json(resultado);
});

export const gerarFatura = asyncHandler(async (req, res) => {
  const titulo = await service.gerarFatura({ empresaId: req.user.empresaId, pedidoIds: req.body.pedidoIds });
  res.status(201).json(titulo);
});
