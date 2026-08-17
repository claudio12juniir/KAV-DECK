import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const listTitulosQuerySchema = paginationQuerySchema.extend({
  tipo: z.enum(["PAGAR", "RECEBER"]).optional(),
  status: z.enum(["ABERTO", "BAIXADO", "VENCIDO", "CANCELADO"]).optional(),
  participanteId: z.string().uuid().optional(),
});

export const baixaSchema = z.object({
  valorBaixado: decimalString(),
  formaBaixa: z.string().min(1).max(60),
  dataBaixa: z.coerce.date().optional(),
});

export const baixarLoteSchema = z.object({
  baixas: z
    .array(
      z.object({
        tituloId: z.string().uuid(),
        valorBaixado: decimalString(),
        formaBaixa: z.string().min(1).max(60),
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
