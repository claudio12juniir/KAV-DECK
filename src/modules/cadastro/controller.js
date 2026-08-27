import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./service.js";

export const criarEmpresa = asyncHandler(async (req, res) => {
  const resultado = await service.criarEmpresaEAdmin({
    usuarioId: req.supabaseUser.id,
    email: req.supabaseUser.email,
    razaoSocial: req.body.razaoSocial,
    cnpj: req.body.cnpj,
    nomeAdmin: req.body.nomeAdmin,
    emailServico: req.body.emailServico,
    preapprovalId: req.body.preapprovalId,
  });
  res.status(201).json(resultado);
});

export const iniciarPagamento = asyncHandler(async (req, res) => {
  const backUrl = `${req.protocol}://${req.get("host")}/criar-conta?retornoPagamento=1`;
  const resultado = await service.iniciarPagamento({ email: req.body.email, cnpj: req.body.cnpj, backUrl });
  res.json(resultado);
});

export const consultarPagamento = asyncHandler(async (req, res) => {
  const resultado = await service.consultarPagamento({ preapprovalId: req.params.preapprovalId });
  res.json(resultado);
});
