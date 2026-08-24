import { z } from "zod";

export const createTributacaoSchema = z.object({
  produtoId: z.string().uuid(),
  cfopId: z.string().uuid(),
  icmsId: z.string().uuid().optional(),
  ipiId: z.string().uuid().optional(),
  pisId: z.string().uuid().optional(),
  cofinsId: z.string().uuid().optional(),
});

export const updateTributacaoSchema = createTributacaoSchema.partial().omit({ produtoId: true, cfopId: true });

export const listTributacaoQuerySchema = z.object({
  produtoId: z.string().uuid().optional(),
});
