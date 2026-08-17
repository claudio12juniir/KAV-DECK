import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const itemDevolucaoSchema = z.object({
  produtoId: z.string().uuid(),
  quantidade: decimalString(),
});

export const createDevolucaoSchema = z.object({
  pedidoVendaId: z.string().uuid(),
  motivo: z.string().trim().min(3, "Informe o motivo da devolução."),
  itens: z.array(itemDevolucaoSchema).min(1),
});

export const listDevolucoesQuerySchema = paginationQuerySchema.extend({
  pedidoVendaId: z.string().uuid().optional(),
});
