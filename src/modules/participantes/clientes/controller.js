import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    q: req.query.q,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getOuCriarConsumidorFinal = asyncHandler(async (req, res) => {
  const cliente = await service.getOuCriarConsumidorFinal({ empresaId: req.user.empresaId });
  res.json(cliente);
});

export const getById = asyncHandler(async (req, res) => {
  const cliente = await service.getClienteTenant({
    empresaId: req.user.empresaId,
    participanteId: req.params.id,
  });
  res.json(cliente);
});

export const updateBloqueio = asyncHandler(async (req, res) => {
  const cliente = await service.updateBloqueio({
    empresaId: req.user.empresaId,
    usuarioId: req.user.id,
    id: req.params.id,
    bloqueioFinanceiro: req.body.bloqueioFinanceiro,
  });
  res.json(cliente);
});

export const listarBloqueios = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.listarBloqueios({
    empresaId: req.user.empresaId,
    id: req.params.id,
    skip,
    take,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const solicitarBloqueio = asyncHandler(async (req, res) => {
  const bloqueio = await service.solicitarBloqueio({
    empresaId: req.user.empresaId,
    usuarioId: req.user.id,
    id: req.params.id,
    tipo: req.body.tipo,
    motivo: req.body.motivo,
  });
  res.status(201).json(bloqueio);
});

export const colocarBloqueioEmAnalise = asyncHandler(async (req, res) => {
  const bloqueio = await service.colocarBloqueioEmAnalise({
    empresaId: req.user.empresaId,
    id: req.params.id,
    bloqueioId: req.params.bloqueioId,
  });
  res.json(bloqueio);
});

export const autorizarBloqueio = asyncHandler(async (req, res) => {
  const bloqueio = await service.autorizarBloqueio({
    empresaId: req.user.empresaId,
    usuarioId: req.user.id,
    id: req.params.id,
    bloqueioId: req.params.bloqueioId,
  });
  res.json(bloqueio);
});

export const negarBloqueio = asyncHandler(async (req, res) => {
  const bloqueio = await service.negarBloqueio({
    empresaId: req.user.empresaId,
    usuarioId: req.user.id,
    id: req.params.id,
    bloqueioId: req.params.bloqueioId,
  });
  res.json(bloqueio);
});
