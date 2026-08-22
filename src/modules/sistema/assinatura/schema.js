import { z } from "zod";

export const pontoIdParamSchema = z.object({ pontoId: z.string().uuid() });

export const trocarCartaoSchema = z.object({ cardTokenId: z.string().min(1) });
