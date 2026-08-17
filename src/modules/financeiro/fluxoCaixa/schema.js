import { z } from "zod";

export const fluxoCaixaQuerySchema = z.object({
  dataInicial: z.coerce.date(),
  dataFinal: z.coerce.date(),
});
