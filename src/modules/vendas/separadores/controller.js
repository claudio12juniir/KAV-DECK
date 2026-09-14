import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const kanban = asyncHandler(async (req, res) => {
  const colunas = await service.kanban({
    empresaId: req.user.empresaId,
    separadorId: req.query.separadorId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json({ colunas });
});
