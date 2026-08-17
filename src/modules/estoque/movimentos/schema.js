import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const listMovimentosQuerySchema = paginationQuerySchema.extend({
  produtoId: z.string().uuid().optional(),
  loteId: z.string().uuid().optional(),
});

export const ajusteItemSchema = z.object({
  loteId: z.string().uuid(),
  // Diferença assinada a aplicar sobre o saldo do lote: positivo entra,
  // negativo sai. Mesma convenção usada no ajuste automático do inventário
  // físico (ver inventariosFisicos/service.js:fechar).
  quantidade: decimalString(),
  motivo: z.string().trim().min(3, "Informe o motivo do ajuste."),
});

export const ajusteEstoqueSchema = ajusteItemSchema;

export const ajusteEstoqueLoteSchema = z.object({
  itens: z.array(ajusteItemSchema).min(1),
});
