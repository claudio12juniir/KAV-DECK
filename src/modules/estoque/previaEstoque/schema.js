import { z } from "zod";

export const previaEstoqueQuerySchema = z.object({
  produtoId: z.string().uuid().optional(),
});
