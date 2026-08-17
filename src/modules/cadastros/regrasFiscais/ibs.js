import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";
import { criarCrudRegraFiscal } from "./factory.js";

const createSchema = z.object({
  descricao: z.string().trim().min(1),
  cst: z.string().trim().min(1).max(4),
  aliquota: decimalString(),
  vigenciaInicio: z.coerce.date(),
  vigenciaFim: z.coerce.date().optional(),
});

export const router = criarCrudRegraFiscal({
  modelo: "regraIbs",
  createSchema,
  updateSchema: createSchema.partial(),
  select: { id: true, descricao: true, cst: true, aliquota: true, vigenciaInicio: true, vigenciaFim: true },
});
