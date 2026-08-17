import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    pedidoVendaId: req.query.pedidoVendaId,
    clienteId: req.query.clienteId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const ocorrencia = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(ocorrencia);
});

export const create = asyncHandler(async (req, res) => {
  const ocorrencia = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(ocorrencia);
});
