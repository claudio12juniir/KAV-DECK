import { z } from "zod";

export const createColaboradorSchema = z.object({
  nome: z.string().min(1).max(120),
  tipo: z.enum(["COMPRADOR", "VENDEDOR", "REPRESENTANTE", "SEPARADOR"]),
  ativo: z.boolean().optional(),
});

export const updateColaboradorSchema = createColaboradorSchema.partial();
