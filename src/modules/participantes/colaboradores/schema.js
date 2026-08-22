import { z } from "zod";

const valorMonetario = z.coerce.number().min(0).optional();

export const createColaboradorSchema = z.object({
  nome: z.string().min(1).max(120),
  tipo: z.enum(["COMPRADOR", "VENDEDOR", "REPRESENTANTE", "SEPARADOR"]),
  ativo: z.boolean().optional(),
  valorSalario: valorMonetario,
  valorValeAlimentacao: valorMonetario,
  valorValeTransporte: valorMonetario,
  valorInss: valorMonetario,
  valorOutrosEncargos: valorMonetario,
});

export const updateColaboradorSchema = createColaboradorSchema.partial();
