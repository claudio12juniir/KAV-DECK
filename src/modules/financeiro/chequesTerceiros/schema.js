import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const createChequeTerceiroSchema = z.object({
  participanteId: z.string().uuid(),
  numero: z.string().min(1).max(30),
  valor: decimalString(),
  dataRecebimento: z.coerce.date().optional(),
});

export const updateStatusChequeSchema = z.object({
  status: z.enum(["COMPENSADO", "DEVOLVIDO"]),
  dataCompensacao: z.coerce.date().optional(),
});

export const listChequesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["EM_CARTEIRA", "COMPENSADO", "DEVOLVIDO"]).optional(),
});
