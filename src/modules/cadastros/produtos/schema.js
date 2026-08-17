import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const createProdutoSchema = z.object({
  codigo: z.string().min(1).max(30),
  descricao: z.string().min(1).max(200),
  unidadeMedidaId: z.string().uuid(),
  categoriaId: z.string().uuid(),
  ncm: z.string().max(20).optional(),
  cstCfopPadrao: z.string().max(20).optional(),
  estoqueMinimo: decimalString().optional(),
  estoqueMaximo: decimalString().optional(),
  perecivel: z.boolean().optional(),
  controlaLote: z.boolean().optional(),
  precoReferencia: decimalString().optional(),
  ativo: z.boolean().optional(),
});

export const updateProdutoSchema = createProdutoSchema.partial();
