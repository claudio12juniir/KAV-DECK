import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const itemNotaFiscalSchema = z.object({
  produtoId: z.string().uuid(),
  cfopId: z.string().uuid(),
  quantidade: decimalString(),
  valorUnitario: decimalString(),
  valorIcms: decimalString().optional(),
  valorIpi: decimalString().optional(),
  valorPis: decimalString().optional(),
  valorCofins: decimalString().optional(),
});

export const createNotaFiscalSchema = z.object({
  serie: z.string().min(1).max(10),
  numero: z.string().min(1).max(20),
  naturezaOperacaoId: z.string().uuid(),
  tipoOperacao: z.enum(["ENTRADA", "SAIDA", "PRODUTOR_RURAL", "TERCEIROS", "INUTILIZACAO"]),
  modeloDocumento: z.enum(["NFE", "NFCE", "NF_FORMULARIO"]).default("NFE"),
  participanteId: z.string().uuid(),
  certificadoDigitalId: z.string().uuid().optional(),
  pedidoCompraId: z.string().uuid().optional(),
  pedidoVendaId: z.string().uuid().optional(),
  itens: z.array(itemNotaFiscalSchema).optional(),
});

export const updateStatusSchema = z
  .object({
    status: z.enum([
      "EM_DIGITACAO",
      "EM_PROCESSAMENTO",
      "AUTORIZADO",
      "CANCELADO",
      "USO_DENEGADO",
      "REJEICAO",
      "ARQUIVO_CRIADO",
    ]),
    chaveAcesso: z.string().length(44).optional(),
  })
  .refine((data) => data.status !== "AUTORIZADO" || !!data.chaveAcesso, {
    message: "chaveAcesso é obrigatória para autorizar a nota fiscal.",
    path: ["chaveAcesso"],
  });

export const manifestacaoSchema = z.object({
  tipoEvento: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]),
});

export const listNotasFiscaisQuerySchema = paginationQuerySchema.extend({
  tipoOperacao: z.enum(["ENTRADA", "SAIDA", "PRODUTOR_RURAL", "TERCEIROS", "INUTILIZACAO"]).optional(),
  modeloDocumento: z.enum(["NFE", "NFCE", "NF_FORMULARIO"]).optional(),
  status: z
    .enum(["EM_DIGITACAO", "EM_PROCESSAMENTO", "AUTORIZADO", "CANCELADO", "USO_DENEGADO", "REJEICAO", "ARQUIVO_CRIADO"])
    .optional(),
  participanteId: z.string().uuid().optional(),
});

export const downloadXmlLoteQuerySchema = z.object({
  ids: z.string().min(1),
});

export const listarItensNotaQuerySchema = paginationQuerySchema.extend({
  produtoId: z.string().uuid().optional(),
  cfopId: z.string().uuid().optional(),
  tipoOperacao: z.enum(["ENTRADA", "SAIDA", "PRODUTOR_RURAL", "TERCEIROS", "INUTILIZACAO"]).optional(),
  status: z
    .enum(["EM_DIGITACAO", "EM_PROCESSAMENTO", "AUTORIZADO", "CANCELADO", "USO_DENEGADO", "REJEICAO", "ARQUIVO_CRIADO"])
    .optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});

export const enviarEmailSchema = z.object({
  destinatario: z.string().email(),
});
