import { auditarAtualizacao, auditarCriacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

const ENTIDADE = "itinerario";

export const consultar = asyncHandler(async (req, res) => {
  const items = await service.consultar({
    empresaId: req.user.empresaId,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
    periodo: req.query.periodo,
    rotaEntregaId: req.query.rotaEntregaId,
    transportadoraId: req.query.transportadoraId,
  });
  res.json({ items });
});

export const getById = asyncHandler(async (req, res) => {
  const itinerario = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(itinerario);
});

export const criar = asyncHandler(async (req, res) => {
  const itinerario = await service.criar({ empresaId: req.user.empresaId, ...req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: itinerario.id,
    usuarioId: req.user.id,
    registro: itinerario,
  });
  res.status(201).json(itinerario);
});

export const gerarAutomatico = asyncHandler(async (req, res) => {
  const itens = await service.gerarAutomatico({ empresaId: req.user.empresaId, ...req.body });
  res.status(201).json({ items: itens });
});

export const vincularPedido = asyncHandler(async (req, res) => {
  const itinerario = await service.vincularPedido({
    empresaId: req.user.empresaId,
    id: req.params.id,
    pedidoId: req.body.pedidoId,
  });
  res.json(itinerario);
});

export const atualizar = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const itinerario = await service.atualizar({ empresaId: req.user.empresaId, id: req.params.id, ...req.body });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: itinerario.id,
    usuarioId: req.user.id,
    antes,
    depois: itinerario,
  });
  res.json(itinerario);
});

export const gerarFatura = asyncHandler(async (req, res) => {
  const titulo = await service.gerarFatura({ empresaId: req.user.empresaId, itinerarioIds: req.body.itinerarioIds });
  res.status(201).json(titulo);
});
