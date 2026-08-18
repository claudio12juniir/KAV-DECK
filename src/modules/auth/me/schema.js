import { z } from "zod";

export const claimSessaoSchema = z.object({
  sessaoId: z.string().min(10).max(100),
  dispositivo: z.string().max(200).optional(),
});
