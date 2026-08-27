import { z } from "zod";

export const cadastroEmpresaSchema = z.object({
  razaoSocial: z.string().min(1).max(200),
  cnpj: z.string().min(11).max(20),
  nomeAdmin: z.string().min(1).max(200),
  emailServico: z.string().email().optional(),
  preapprovalId: z.string().min(1).max(200),
});

export const iniciarPagamentoSchema = z.object({
  email: z.string().email(),
  cnpj: z.string().min(11).max(20),
});
