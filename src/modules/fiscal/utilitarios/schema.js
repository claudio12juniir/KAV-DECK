import { z } from "zod";

export const relatorioFiscalQuerySchema = z.object({
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
