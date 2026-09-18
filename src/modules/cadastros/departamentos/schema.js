import { z } from "zod";

export const createDepartamentoSchema = z.object({
  codigo: z.string().min(1).max(30),
  nome: z.string().min(1).max(120),
  ativo: z.boolean().optional(),
});

export const updateDepartamentoSchema = createDepartamentoSchema.partial();
