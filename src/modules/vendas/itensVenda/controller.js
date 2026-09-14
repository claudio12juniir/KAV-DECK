import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

function filtrosDaQuery(req) {
  return {
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
    data: req.query.data,
    clienteTexto: req.query.cliente,
    produtoTexto: req.query.produto,
    categoriaId: req.query.categoriaId,
    departamentoId: req.query.departamentoId,
    periodo: req.query.periodo,
    impresso: req.query.impresso,
    valorZero: req.query.valorZero,
  };
}

export const listar = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.listar({ ...filtrosDaQuery(req), skip, take });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const totais = asyncHandler(async (req, res) => {
  const items = await service.totais(filtrosDaQuery(req));
  res.json({ items });
});

export const marcarImpresso = asyncHandler(async (req, res) => {
  const item = await service.marcarImpresso({
    empresaId: req.user.empresaId,
    id: req.params.id,
    impresso: req.body.impresso,
  });
  res.json(item);
});
