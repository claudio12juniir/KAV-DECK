import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const createInventarioFisicoSchema = z.object({
  responsavelId: z.string().uuid().optional(),
  itens: z
    .array(
      z.object({
        loteId: z.string().uuid(),
        quantidadeContada: decimalString(),
      }),
    )
    .min(1),
});
