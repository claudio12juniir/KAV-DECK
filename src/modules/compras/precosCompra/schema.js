import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const upsertPrecoCompraSchema = z.object({
  fornecedorId: z.string().uuid(),
  produtoId: z.string().uuid(),
  preco: decimalString(),
});

export const listPrecosCompraQuerySchema = paginationQuerySchema.extend({
  fornecedorId: z.string().uuid().optional(),
  produtoId: z.string().uuid().optional(),
});
