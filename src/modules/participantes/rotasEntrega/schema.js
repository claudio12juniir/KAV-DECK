import { z } from "zod";

export const createRotaEntregaSchema = z.object({
  nome: z.string().min(1).max(120),
  transportadoraId: z.string().uuid().optional(),
});

export const updateRotaEntregaSchema = createRotaEntregaSchema.partial();
