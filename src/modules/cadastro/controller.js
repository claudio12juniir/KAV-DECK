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
  });
  res.status(201).json(resultado);
});

export const iniciarPagamento = asyncHandler(async (req, res) => {
  const backUrl = `${req.protocol}://${req.get("host")}/`;
  const resultado = await service.iniciarPagamento({ usuarioId: req.supabaseUser.id, backUrl });
  res.json(resultado);
});
