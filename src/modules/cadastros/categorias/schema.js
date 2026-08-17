import { z } from "zod";

export const createCategoriaSchema = z.object({
  codigo: z.string().min(1).max(30),
  nome: z.string().min(1).max(120),
  departamentoId: z.string().uuid(),
});

export const updateCategoriaSchema = createCategoriaSchema.partial();
