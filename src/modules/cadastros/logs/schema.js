import { z } from "zod";

export const listLogsQuerySchema = z.object({
  entidade: z.string().min(1),
  entidadeId: z.string().uuid(),
});
