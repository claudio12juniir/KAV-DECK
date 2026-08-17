import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const consultar = asyncHandler(async (req, res) => {
  const items = await service.consultar({ empresaId: req.user.empresaId, produtoId: req.query.produtoId });
  res.json({ items });
});
