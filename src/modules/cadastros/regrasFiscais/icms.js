import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";
import { criarCrudRegraFiscal } from "./factory.js";

const createSchema = z.object({
  descricao: z.string().trim().min(1),
  cstOrigem: z.string().trim().min(1).max(4),
  cstTributacao: z.string().trim().min(1).max(4),
  aliquota: decimalString(),
  baseCalculo: decimalString(),
  modalidade: z.string().trim().min(1),
});

export const router = criarCrudRegraFiscal({
  modelo: "regraIcms",
  createSchema,
  updateSchema: createSchema.partial(),
  select: {
    id: true,
    descricao: true,
    cstOrigem: true,
    cstTributacao: true,
    aliquota: true,
    baseCalculo: true,
    modalidade: true,
  },
});
