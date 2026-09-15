import { z } from "zod";

export const previaEstoqueQuerySchema = z.object({
  produtoId: z.string().uuid().optional(),
  departamentoId: z.string().uuid().optional(),
  produto: z.string().trim().min(1).optional(),
  exibirSemMovimento: z.coerce.boolean().optional(),
});
