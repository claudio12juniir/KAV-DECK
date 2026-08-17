import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const enderecoSchema = z.object({
  tipo: z.enum(["PRINCIPAL", "COBRANCA", "ENTREGA"]),
  logradouro: z.string().min(1).max(200),
  numero: z.string().min(1).max(20),
  bairro: z.string().min(1).max(120),
  cidade: z.string().min(1).max(120),
  uf: z.string().length(2),
  cep: z.string().min(8).max(9),
});

export const createParticipanteSchema = z.object({
  tipoPessoa: z.enum(["FISICA", "JURIDICA"]),
  razaoSocial: z.string().min(1).max(200),
  nomeFantasia: z.string().max(200).optional(),
  cpfCnpj: z.string().min(11).max(18),
  ie: z.string().max(20).optional(),
  condicaoPagamentoId: z.string().uuid().optional(),
  limiteCredito: decimalString().optional(),
  despesasRepassaveis: z.boolean().optional(),
  permiteEmissaoCheque: z.boolean().optional(),
  isProdutorRural: z.boolean().optional(),
  dapProdutorRural: z.string().max(60).optional(),
  talaoProdutorRural: z.string().max(60).optional(),
  grupoEmpresasId: z.string().uuid().optional(),
  ativo: z.boolean().optional(),
  enderecos: z.array(enderecoSchema).optional(),
});

export const updateParticipanteSchema = createParticipanteSchema.omit({ enderecos: true }).partial();

export const promoteClienteSchema = z.object({
  vendedorPadraoId: z.string().uuid().optional(),
  rotaEntregaId: z.string().uuid().optional(),
  tabelaPrecoId: z.string().uuid().optional(),
});
