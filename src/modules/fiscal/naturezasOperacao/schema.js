import { z } from "zod";

export const createNaturezaOperacaoSchema = z.object({
  descricao: z.string().min(1).max(120),
  cfopPadraoId: z.string().uuid(),
});

export const updateNaturezaOperacaoSchema = createNaturezaOperacaoSchema.partial();
