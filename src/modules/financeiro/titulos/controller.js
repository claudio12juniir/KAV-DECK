import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    tipo: req.query.tipo,
    status: req.query.status,
    participanteId: req.query.participanteId,
    q: req.query.q,
    vencimentoInicial: req.query.vencimentoInicial,
    vencimentoFinal: req.query.vencimentoFinal,
    ordenarPor: req.query.ordenarPor,
    ordem: req.query.ordem,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const titulo = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(titulo);
});

export const baixar = asyncHandler(async (req, res) => {
  const titulo = await service.baixar({
    empresaId: req.user.empresaId,
    id: req.params.id,
    valorBaixado: req.body.valorBaixado,
    formaBaixa: req.body.formaBaixa,
    dataBaixa: req.body.dataBaixa,
  });
  res.status(201).json(titulo);
});

export const baixarLote = asyncHandler(async (req, res) => {
  const resultado = await service.baixarLote({ empresaId: req.user.empresaId, baixas: req.body.baixas });
  res.status(201).json(resultado);
});

export const cancelar = asyncHandler(async (req, res) => {
  const titulo = await service.cancelar({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(titulo);
});

export const reverterBaixa = asyncHandler(async (req, res) => {
  const titulo = await service.reverterBaixa({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(titulo);
});

export const parcelar = asyncHandler(async (req, res) => {
  const resultado = await service.parcelar({
    empresaId: req.user.empresaId,
    id: req.params.id,
    parcelas: req.body.parcelas,
  });
  res.status(201).json(resultado);
});

export const duplicar = asyncHandler(async (req, res) => {
  const titulo = await service.duplicar({ empresaId: req.user.empresaId, id: req.params.id });
  res.status(201).json(titulo);
});

export const agrupar = asyncHandler(async (req, res) => {
  const consolidado = await service.agrupar({
    empresaId: req.user.empresaId,
    tituloIds: req.body.tituloIds,
    vencimento: req.body.vencimento,
  });
  res.status(201).json(consolidado);
});
