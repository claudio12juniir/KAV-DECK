import { z } from "zod";

export const consultarRecebimentoQuerySchema = z.object({
  fornecedorId: z.string().uuid().optional(),
  produtoId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
