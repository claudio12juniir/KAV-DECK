import { z } from "zod";

export const analyticsQuerySchema = z.object({
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
