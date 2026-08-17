import archiver from "archiver";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as transmissaoSefazService from "../transmissaoSefaz/service.js";
import * as service from "./service.js";
import { gerarXmlNota, nomeArquivoXml } from "./xml.js";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({
    empresaId: req.user.empresaId,
    skip,
    take,
    tipoOperacao: req.query.tipoOperacao,
    modeloDocumento: req.query.modeloDocumento,
    status: req.query.status,
    participanteId: req.query.participanteId,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const nota = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(nota);
});

export const create = asyncHandler(async (req, res) => {
  const nota = await service.create({ empresaId: req.user.empresaId, data: req.body });
  res.status(201).json(nota);
});

export const addItem = asyncHandler(async (req, res) => {
  const item = await service.addItem({
    empresaId: req.user.empresaId,
    notaFiscalId: req.params.id,
    data: req.body,
  });
  res.status(201).json(item);
});

export const removeItem = asyncHandler(async (req, res) => {
  await service.removeItem({
    empresaId: req.user.empresaId,
    notaFiscalId: req.params.id,
    itemId: req.params.itemId,
  });
  res.status(204).send();
});

export const updateStatus = asyncHandler(async (req, res) => {
  const nota = await service.updateStatus({
    empresaId: req.user.empresaId,
    id: req.params.id,
    status: req.body.status,
    chaveAcesso: req.body.chaveAcesso,
  });
  res.json(nota);
});

export const addManifestacao = asyncHandler(async (req, res) => {
  const manifestacao = await service.addManifestacao({
    empresaId: req.user.empresaId,
    notaFiscalId: req.params.id,
    tipoEvento: req.body.tipoEvento,
  });
  res.status(201).json(manifestacao);
});

export const downloadXmlLote = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const notas = await service.listarParaXml({ empresaId: req.user.empresaId, ids });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=notas-fiscais-xml.zip");

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => res.destroy(err));
  archive.pipe(res);
  for (const nota of notas) {
    archive.append(gerarXmlNota(nota), { name: nomeArquivoXml(nota) });
  }
  await archive.finalize();
});

export const listarItens = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.listarItens({
    empresaId: req.user.empresaId,
    skip,
    take,
    produtoId: req.query.produtoId,
    cfopId: req.query.cfopId,
    tipoOperacao: req.query.tipoOperacao,
    status: req.query.status,
    dataInicial: req.query.dataInicial,
    dataFinal: req.query.dataFinal,
  });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const enviarEmail = asyncHandler(async (req, res) => {
  const resultado = await service.enviarPorEmail({
    empresaId: req.user.empresaId,
    id: req.params.id,
    destinatario: req.body.destinatario,
  });
  res.json(resultado);
});

export const transmitir = asyncHandler(async (req, res) => {
  const resultado = await transmissaoSefazService.transmitir({
    empresaId: req.user.empresaId,
    notaFiscalId: req.params.id,
  });
  res.json(resultado);
});
