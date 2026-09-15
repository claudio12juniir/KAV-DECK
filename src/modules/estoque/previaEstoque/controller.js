import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const consultar = asyncHandler(async (req, res) => {
  const items = await service.consultar({
    empresaId: req.user.empresaId,
    produtoId: req.query.produtoId,
    departamentoId: req.query.departamentoId,
    produto: req.query.produto,
    exibirSemMovimento: req.query.exibirSemMovimento,
  });
  res.json({ items });
});
