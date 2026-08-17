import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const obter = asyncHandler(async (req, res) => {
  const configuracao = await service.obter({ empresaId: req.user.empresaId });
  res.json(configuracao);
});

export const salvar = asyncHandler(async (req, res) => {
  const configuracao = await service.salvar({ empresaId: req.user.empresaId, ...req.body });
  res.json(configuracao);
});
