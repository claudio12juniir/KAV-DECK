import { z } from "zod";

export const pontoIdParamSchema = z.object({ pontoId: z.string().uuid() });

export const comprarAcessoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  role: z.enum(["FUNCIONARIO", "ADMIN"]),
});

export const trocarCartaoSchema = z.object({ cardTokenId: z.string().min(1) });

const enderecoSchema = z.object({
  cep: z.string().trim().min(1),
  logradouro: z.string().trim().min(1),
  numero: z.string().trim().min(1),
  bairro: z.string().trim().min(1),
  cidade: z.string().trim().min(1),
  uf: z.string().trim().length(2),
});

export const trocarFormaPagamentoSchema = z.object({
  formaPagamento: z.enum(["CARTAO", "PIX", "BOLETO"]),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "CPF deve ter 11 dígitos.")
    .optional(),
  endereco: enderecoSchema.optional(),
});
