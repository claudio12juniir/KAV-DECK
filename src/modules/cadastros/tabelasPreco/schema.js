import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const createTabelaPrecoSchema = z.object({
  nome: z.string().min(1).max(120),
  vigenciaInicio: z.coerce.date(),
  vigenciaFim: z.coerce.date().optional(),
  ativa: z.boolean().optional(),
});

export const updateTabelaPrecoSchema = createTabelaPrecoSchema.partial();

export const upsertItemTabelaPrecoSchema = z.object({
  produtoId: z.string().uuid(),
  preco: decimalString(),
});

export const itemParamSchema = z.object({
  id: z.string().uuid(),
  produtoId: z.string().uuid(),
});
