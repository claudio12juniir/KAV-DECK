import { auditarAtualizacao, auditarCriacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "titulo";

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
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const titulo = await service.baixar({
    empresaId: req.user.empresaId,
    id: req.params.id,
    valorBaixado: req.body.valorBaixado,
    formaBaixa: req.body.formaBaixa,
    dataBaixa: req.body.dataBaixa,
  });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: titulo.id,
    usuarioId: req.user.id,
    antes,
    depois: titulo,
  });
  res.status(201).json(titulo);
});

// Baixa em lote não devolve os títulos atualizados (só a contagem) — busca
// o "antes" de cada um antes de processar e o "depois" na sequência, fora
// da transação do service (auditoria nunca deve fazer parte da mesma
// transação da operação financeira, ver auditLog.js).
export const baixarLote = asyncHandler(async (req, res) => {
  const tituloIds = req.body.baixas.map((b) => b.tituloId);
  const antesPorId = new Map(
    await Promise.all(
      tituloIds.map(async (id) => [id, await service.getById({ empresaId: req.user.empresaId, id })]),
    ),
  );
  const resultado = await service.baixarLote({ empresaId: req.user.empresaId, baixas: req.body.baixas });
  await Promise.all(
    tituloIds.map(async (id) => {
      const depois = await service.getById({ empresaId: req.user.empresaId, id });
      await auditarAtualizacao({
        empresaId: req.user.empresaId,
        entidade: ENTIDADE,
        entidadeId: id,
        usuarioId: req.user.id,
        antes: antesPorId.get(id),
        depois,
      });
    }),
  );
  res.status(201).json(resultado);
});

export const cancelar = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const titulo = await service.cancelar({ empresaId: req.user.empresaId, id: req.params.id });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: titulo.id,
    usuarioId: req.user.id,
    antes,
    depois: titulo,
  });
  res.json(titulo);
});

export const reverterBaixa = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const titulo = await service.reverterBaixa({ empresaId: req.user.empresaId, id: req.params.id });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: titulo.id,
    usuarioId: req.user.id,
    antes,
    depois: titulo,
  });
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
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: titulo.id,
    usuarioId: req.user.id,
    registro: titulo,
  });
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
