import { z } from "zod";
import { paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const listarItensQuerySchema = paginationQuerySchema.extend({
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
  data: z.coerce.date().optional(),
  cliente: z.string().optional(),
  produto: z.string().optional(),
  categoriaId: z.string().uuid().optional(),
  departamentoId: z.string().uuid().optional(),
  periodo: z.enum(["MANHA", "TARDE", "NOITE", "SOS", "RETIRA"]).optional(),
  impresso: z.coerce.boolean().optional(),
  valorZero: z.coerce.boolean().optional(),
});

export const marcarImpressoSchema = z.object({
  impresso: z.boolean(),
});
