import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const obter = asyncHandler(async (req, res) => {
  const empresa = await service.obter({ empresaId: req.user.empresaId });
  res.json(empresa);
});

export const atualizar = asyncHandler(async (req, res) => {
  const empresa = await service.atualizar({ empresaId: req.user.empresaId, data: req.body });
  res.json(empresa);
});
