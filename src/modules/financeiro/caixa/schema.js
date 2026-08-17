import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const createMovimentoCaixaSchema = z.object({
  contaBancariaId: z.string().uuid().optional(),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  valor: decimalString(),
  descricao: z.string().max(200).optional(),
  data: z.coerce.date().optional(),
});

export const listMovimentosCaixaQuerySchema = paginationQuerySchema.extend({
  contaBancariaId: z.string().uuid().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});
