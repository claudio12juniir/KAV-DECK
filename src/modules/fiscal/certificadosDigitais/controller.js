import { asyncHandler } from "../../../utils/asyncHandler.js";
import { AppError } from "../../../utils/AppError.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";
import * as service from "./service.js";

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
  res.status(201).json(certificado);
});

export const update = asyncHandler(async (req, res) => {
  const certificado = await service.update({
    empresaId: req.user.empresaId,
    id: req.params.id,
    data: req.body,
  });
  res.json(certificado);
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove({ empresaId: req.user.empresaId, id: req.params.id });
  res.status(204).send();
});

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(422, "ARQUIVO_OBRIGATORIO", "Envie o certificado (.pfx) no campo 'file'.");
  const certificado = await service.upload({
    empresaId: req.user.empresaId,
    arquivoBuffer: req.file.buffer,
    nomeArquivo: req.file.originalname,
    senha: req.body.senha,
  });
  res.status(201).json(certificado);
});
