import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const createTipoCaixaEmbalagemSchema = z.object({
  nome: z.string().min(1).max(120),
  capacidade: decimalString().optional(),
});

export const updateTipoCaixaEmbalagemSchema = createTipoCaixaEmbalagemSchema.partial();

export const createMovimentoComodatoSchema = z.object({
  participanteId: z.string().uuid(),
  tipo: z.enum(["ENTREGA", "DEVOLUCAO"]),
  quantidade: decimalString(),
});
