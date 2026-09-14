import { z } from "zod";

export const kanbanQuerySchema = z.object({
  separadorId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
