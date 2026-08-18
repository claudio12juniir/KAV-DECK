import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const listar = asyncHandler(async (req, res) => {
  const items = await service.listar({ empresaId: req.user.empresaId });
  res.json({ items });
});

export const revogar = asyncHandler(async (req, res) => {
  await service.revogar({ empresaId: req.user.empresaId, usuarioId: req.params.usuarioId });
  res.status(204).end();
});
