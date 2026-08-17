import { z } from "zod";

export const consultarFreteQuerySchema = z.object({
  transportadoraId: z.string().uuid().optional(),
});

export const gerarFaturaFreteSchema = z.object({
  pedidoIds: z.array(z.string().uuid()).min(1),
});
