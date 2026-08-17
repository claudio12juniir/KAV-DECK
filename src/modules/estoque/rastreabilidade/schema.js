import { z } from "zod";
import { paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const listarMovimentosQuerySchema = paginationQuerySchema.extend({
  produtoId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});

export const listarLotesQuerySchema = paginationQuerySchema.extend({
  produtoId: z.string().uuid().optional(),
});

export const loteParamSchema = z.object({ loteId: z.string().uuid() });
