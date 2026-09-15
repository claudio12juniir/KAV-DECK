import { z } from "zod";

export const estoqueFaturadoQuerySchema = z.object({
  produtoId: z.string().uuid().optional(),
  departamentoId: z.string().uuid().optional(),
  produto: z.string().trim().min(1).optional(),
  ordenacao: z.enum(["PRODUTO", "SALDO"]).optional(),
});
