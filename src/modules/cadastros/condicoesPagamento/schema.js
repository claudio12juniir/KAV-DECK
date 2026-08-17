import { z } from "zod";

export const createCondicaoPagamentoSchema = z.object({
  descricao: z.string().min(1).max(120),
  numeroParcelas: z.coerce.number().int().positive(),
  intervaloDias: z.coerce.number().int().nonnegative(),
});

export const updateCondicaoPagamentoSchema = createCondicaoPagamentoSchema.partial();
