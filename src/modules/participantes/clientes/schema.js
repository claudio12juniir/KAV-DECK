import { z } from "zod";
import { paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const updateBloqueioSchema = z.object({
  bloqueioFinanceiro: z.enum(["LIBERADO", "BLOQUEADO"]),
});

export const solicitarBloqueioSchema = z.object({
  tipo: z.enum(["BLOQUEAR", "DESBLOQUEAR"]),
  motivo: z.string().trim().min(3).optional(),
});

export const listBloqueiosQuerySchema = paginationQuerySchema;
