import { z } from "zod";

export const faturaProdutorQuerySchema = z.object({
  transportadoraId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});

export const gerarFaturaProdutorSchema = faturaProdutorQuerySchema;
