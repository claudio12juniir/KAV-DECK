import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

export const itemPedidoVendaSchema = z.object({
  produtoId: z.string().uuid(),
  quantidade: decimalString(),
  precoUnitario: decimalString(),
  desconto: decimalString().optional(),
});

export const createPedidoVendaSchema = z.object({
  clienteId: z.string().uuid(),
  vendedorId: z.string().uuid().optional(),
  tabelaPrecoId: z.string().uuid().optional(),
  condicaoPagamentoId: z.string().uuid().optional(),
  rotaEntregaId: z.string().uuid().optional(),
  itens: z.array(itemPedidoVendaSchema).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ABERTO", "SEPARACAO", "FATURADO", "CANCELADO"]),
});

export const faturarItemSchema = z.object({
  produtoId: z.string().uuid(),
  loteId: z.string().uuid(),
  quantidade: decimalString(),
});

export const faturarSchema = z.object({
  itens: z.array(faturarItemSchema).min(1),
});

export const agruparNfSchema = z.object({
  pedidoIds: z.array(z.string().uuid()).min(2, "Selecione pelo menos 2 pedidos para agrupar numa NF."),
  serie: z.string().min(1).max(10),
  numero: z.string().min(1).max(20),
  naturezaOperacaoId: z.string().uuid(),
  tipoOperacao: z.enum(["ENTRADA", "SAIDA", "PRODUTOR_RURAL", "TERCEIROS", "INUTILIZACAO"]).default("SAIDA"),
  cfopId: z.string().uuid(),
  certificadoDigitalId: z.string().uuid().optional(),
});

export const separarSchema = z.object({
  separadorId: z.string().uuid().optional(),
});

export const aplicarDescontoSchema = z.object({
  desconto: decimalString(),
});

export const dividirSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

export const atribuirItinerarioSchema = z
  .object({
    rotaEntregaId: z.string().uuid().optional(),
    turno: z.enum(["MANHA", "TARDE", "NOITE", "SOS", "RETIRA"]).optional(),
  })
  .refine((data) => data.rotaEntregaId || data.turno, {
    message: "Informe rotaEntregaId e/ou turno.",
  });
