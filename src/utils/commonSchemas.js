import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().uuid() });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const decimalString = () =>
  z
    .union([z.number(), z.string()])
    .transform((v) => String(v))
    .refine((v) => /^-?\d+(\.\d+)?$/.test(v), { message: "Valor decimal inválido." });
