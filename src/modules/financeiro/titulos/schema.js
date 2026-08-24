import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

// Espelha o enum FormaBaixaTitulo do schema.prisma — como forma de pagar é
// só metadado (não há integração real de gateway, ver decisão da sessão),
// bastou trocar o texto livre por um conjunto fechado de opções.
export const FORMAS_BAIXA = ["BOLETO", "DEBITO_AUTOMATICO", "CARTAO_CREDITO", "PIX", "DINHEIRO", "CHEQUE", "OUTRO"];

export const listTitulosQuerySchema = paginationQuerySchema.extend({
  tipo: z.enum(["PAGAR", "RECEBER"]).optional(),
  status: z.enum(["ABERTO", "BAIXADO", "VENCIDO", "CANCELADO"]).optional(),
  participanteId: z.string().uuid().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  vencimentoInicial: z.coerce.date().optional(),
  vencimentoFinal: z.coerce.date().optional(),
  ordenarPor: z.enum(["vencimento", "valor", "numero"]).optional(),
  ordem: z.enum(["asc", "desc"]).optional(),
});

export const baixaSchema = z.object({
  valorBaixado: decimalString(),
  formaBaixa: z.enum(FORMAS_BAIXA),
  dataBaixa: z.coerce.date().optional(),
});

export const baixarLoteSchema = z.object({
  baixas: z
    .array(
      z.object({
        tituloId: z.string().uuid(),
        valorBaixado: decimalString(),
        formaBaixa: z.enum(FORMAS_BAIXA),
        dataBaixa: z.coerce.date().optional(),
      }),
    )
    .min(1),
});

export const parcelarSchema = z.object({
  parcelas: z
    .array(
      z.object({
        valor: decimalString(),
        vencimento: z.coerce.date(),
      }),
    )
    .min(2, "Um parcelamento precisa de pelo menos 2 parcelas."),
});

export const agruparSchema = z.object({
  tituloIds: z.array(z.string().uuid()).min(2, "Selecione pelo menos 2 títulos para agrupar."),
  vencimento: z.coerce.date().optional(),
});
