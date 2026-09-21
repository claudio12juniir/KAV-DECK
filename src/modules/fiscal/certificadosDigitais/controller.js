import { auditarAtualizacao, auditarCriacao, auditarExclusao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { AppError } from "../../../utils/AppError.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

const ENTIDADE = "certificado-digital";

export const list = asyncHandler(async (req, res) => {
  const { skip, take, page, pageSize } = parsePagination(req.query);
  const { items, total } = await service.list({ empresaId: req.user.empresaId, skip, take });
  res.json(buildPaginatedResult({ items, total, page, pageSize }));
});

export const getById = asyncHandler(async (req, res) => {
  const certificado = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  res.json(certificado);
});

export const create = asyncHandler(async (req, res) => {
  const certificado = await service.create({ empresaId: req.user.empresaId, data: req.body });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: certificado.id,
    usuarioId: req.user.id,
    registro: certificado,
  });
  res.status(201).json(certificado);
});

export const update = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  const certificado = await service.update({
    empresaId: req.user.empresaId,
    id: req.params.id,
    data: req.body,
  });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: certificado.id,
    usuarioId: req.user.id,
    antes,
    depois: certificado,
  });
  res.json(certificado);
});

export const remove = asyncHandler(async (req, res) => {
  const antes = await service.getById({ empresaId: req.user.empresaId, id: req.params.id });
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  await auditarExclusao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: req.params.id,
    usuarioId: req.user.id,
    registro: antes,
  });
  res.status(204).send();
});

// SELECT do service só devolve {id, nome, dataVencimento} — nunca o arquivo
// .pfx nem a senha, então é seguro auditar o resultado direto (igual ao
// create acima), sem risco de vazar segredo no histórico.
export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(422, "ARQUIVO_OBRIGATORIO", "Envie o certificado (.pfx) no campo 'file'.");
  const certificado = await service.upload({
    empresaId: req.user.empresaId,
    arquivoBuffer: req.file.buffer,
    nomeArquivo: req.file.originalname,
    senha: req.body.senha,
  });
  await auditarCriacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: certificado.id,
    usuarioId: req.user.id,
    registro: certificado,
  });
  res.status(201).json(certificado);
});
