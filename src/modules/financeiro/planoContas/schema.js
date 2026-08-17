import { z } from "zod";

export const createPlanoContasSchema = z.object({
  codigo: z.string().min(1).max(30),
  nome: z.string().min(1).max(120),
  tipo: z.string().min(1).max(40),
  contaPaiId: z.string().uuid().optional(),
});

export const updatePlanoContasSchema = createPlanoContasSchema.partial();
