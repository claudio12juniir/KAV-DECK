import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const itemPedidoCompraSchema = z.object({
  produtoId: z.string().uuid(),
  loteId: z.string().uuid().optional(),
  quantidade: decimalString(),
  precoUnitario: decimalString(),
});

export const createPedidoCompraSchema = z.object({
  fornecedorId: z.string().uuid(),
  compradorId: z.string().uuid().optional(),
  condicaoPagamentoId: z.string().uuid().optional(),
  itens: z.array(itemPedidoCompraSchema).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ABERTO", "APROVADO", "RECEBIDO_PARCIAL", "RECEBIDO", "CANCELADO"]),
});

export const receberItemSchema = z.object({
  produtoId: z.string().uuid(),
  quantidade: decimalString(),
  dataValidade: z.coerce.date().optional(),
  sif: z.string().max(60).optional(),
  temperaturaRecebimento: decimalString().optional(),
  veiculo: z.string().max(60).optional(),
});

export const receberSchema = z.object({
  itens: z.array(receberItemSchema).min(1),
});

export const estornarLoteSchema = z.object({
  pedidoIds: z.array(z.string().uuid()).min(1),
});

export const listarItensQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  produtoId: z.string().uuid().optional(),
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
});

export const favoritosQuerySchema = z.object({
  fornecedorId: z.string().uuid(),
  limite: z.coerce.number().int().positive().max(50).optional(),
});

export const importarItensSchema = z.object({
  pedidoOrigemId: z.string().uuid(),
});

export const aplicarFreteSchema = z.object({
  transportadoraId: z.string().uuid().optional(),
  valorFrete: decimalString(),
});
