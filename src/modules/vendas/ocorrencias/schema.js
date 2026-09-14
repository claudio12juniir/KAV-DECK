import { z } from "zod";
import { decimalString, paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const itemOcorrenciaSchema = z.object({
  produtoId: z.string().uuid(),
  quantidade: decimalString(),
  valor: decimalString().optional(),
});

export const createOcorrenciaSchema = z.object({
  pedidoVendaId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  tipo: z.string().trim().min(1).max(60),
  motivo: z.string().trim().min(3),
  // "Qual foi a Resolução?" — opcional, a ocorrência pode nascer sem
  // resolução ainda definida (ver seção 13 do mapeamento).
  resolucao: z.string().trim().min(1).max(120).optional(),
  data: z.coerce.date().optional(),
  itens: z.array(itemOcorrenciaSchema).optional(),
});

export const listOcorrenciasQuerySchema = paginationQuerySchema.extend({
  pedidoVendaId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});
