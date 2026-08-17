import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const createUnidadeMedidaSchema = z.object({
  sigla: z.string().min(1).max(10),
  descricao: z.string().min(1).max(120),
  fatorConversao: decimalString().optional(),
});

export const updateUnidadeMedidaSchema = createUnidadeMedidaSchema.partial();
