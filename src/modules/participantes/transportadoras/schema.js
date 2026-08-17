import { z } from "zod";

export const createTransportadoraSchema = z.object({
  razaoSocial: z.string().min(1).max(200),
  cnpj: z.string().min(11).max(18),
  ativo: z.boolean().optional(),
});

export const updateTransportadoraSchema = createTransportadoraSchema.partial();
