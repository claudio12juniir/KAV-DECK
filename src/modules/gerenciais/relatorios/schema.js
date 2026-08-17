import { z } from "zod";

export const relatorioGerencialQuerySchema = z.object({
  dataInicial: z.coerce.date(),
  dataFinal: z.coerce.date(),
});
