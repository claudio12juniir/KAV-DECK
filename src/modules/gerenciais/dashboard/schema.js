import { z } from "zod";

export const faturamentoQuerySchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
});

export const titulosAnualQuerySchema = z.object({
  anos: z
    .string()
    .min(1)
    .transform((v) => v.split(",").map((n) => Number(n.trim())))
    .refine((anos) => anos.every((a) => Number.isInteger(a) && a >= 2000 && a <= 2100), {
      message: "Lista de anos inválida.",
    }),
});
