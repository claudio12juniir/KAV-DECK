import { z } from "zod";
import { paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const createOcorrenciaSchema = z.object({
  pedidoVendaId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  tipo: z.string().trim().min(1).max(60),
  motivo: z.string().trim().min(3),
  data: z.coerce.date().optional(),
});

export const listOcorrenciasQuerySchema = paginationQuerySchema.extend({
  pedidoVendaId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
