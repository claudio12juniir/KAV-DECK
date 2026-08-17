import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const consultar = asyncHandler(async (req, res) => {
  const items = await service.consultar({
    empresaId: req.user.empresaId,
    data: req.query.data,
    turno: req.query.turno,
    rotaEntregaId: req.query.rotaEntregaId,
  });
  res.json({ items });
});
