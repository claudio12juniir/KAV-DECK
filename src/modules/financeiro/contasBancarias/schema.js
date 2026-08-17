import { z } from "zod";

export const createContaBancariaSchema = z.object({
  banco: z.string().min(1).max(120),
  agencia: z.string().min(1).max(20),
  conta: z.string().min(1).max(30),
});

export const updateContaBancariaSchema = createContaBancariaSchema.partial();
