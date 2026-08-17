import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const projetar = asyncHandler(async (req, res) => {
  const resultado = await service.projetar({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(resultado);
});
