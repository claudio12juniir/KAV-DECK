import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

export const listarCatalogo = asyncHandler(async (req, res) => {
  res.json({ items: service.listarCatalogo() });
});

export const listarUsuarios = asyncHandler(async (req, res) => {
  const items = await service.listarUsuarios({ empresaId: req.user.empresaId });
  res.json({ items });
});

export const obterPermissoes = asyncHandler(async (req, res) => {
  const resultado = await service.obterPermissoes({
    empresaId: req.user.empresaId,
    usuarioId: req.params.usuarioId,
  });
  res.json(resultado);
});

export const definirPermissao = asyncHandler(async (req, res) => {
  const permissao = await service.definirPermissao({
    empresaId: req.user.empresaId,
    usuarioId: req.params.usuarioId,
    ...req.body,
  });
  res.json(permissao);
});

export const removerOverride = asyncHandler(async (req, res) => {
  await service.removerOverride({
    empresaId: req.user.empresaId,
    usuarioId: req.params.usuarioId,
    modulo: req.params.modulo,
    acao: req.params.acao,
  });
  res.status(204).end();
});

export const redefinirSenha = asyncHandler(async (req, res) => {
  const resultado = await service.redefinirSenha({
    empresaId: req.user.empresaId,
    usuarioId: req.params.usuarioId,
    novaSenha: req.body.novaSenha,
  });
  res.json(resultado);
});
