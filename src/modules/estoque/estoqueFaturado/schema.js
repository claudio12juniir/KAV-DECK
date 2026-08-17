import { z } from "zod";

export const estoqueFaturadoQuerySchema = z.object({
  produtoId: z.string().uuid().optional(),
});
