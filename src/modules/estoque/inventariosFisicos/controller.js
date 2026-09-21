import { auditarAtualizacao, auditarCriacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "inventario-fisico";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({ empresaId: req.user.empresaId, skip, take });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const inventario = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(inventario);
});

export const create = asyncHandler(async (req, res) => {
  const inventario = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: inventario.id,
    usuarioId: req.user.id,
    registro: { data: inventario.data, responsavelId: inventario.responsavelId, itens: inventario.itens.length },
  });
  res.status(201).json(inventario);
});

// "fechar" não é uma edição de campo comum (é uma transição de estado que
// dispara ajuste real de estoque por lote, ver service.fechar) — por isso o
// antes/depois sintético abaixo, em vez de comparar o registro inteiro.
export const fechar = asyncHandler(async (req, res) => {
  const resultado = await service.fechar({ empresaId: req.user.empresaId, id: req.params.id });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: req.params.id,
    usuarioId: req.user.id,
    antes: { status: "aberto" },
    depois: { status: "fechado", ajustesAplicados: resultado.ajustesAplicados },
  });
  res.json(resultado);
});
