import { z } from "zod";

export const usuarioIdParamSchema = z.object({ usuarioId: z.string().uuid() });
