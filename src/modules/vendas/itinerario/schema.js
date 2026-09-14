import { z } from "zod";
import { decimalString } from "../../../utils/commonSchemas.js";

const periodoEnum = z.enum(["MANHA", "TARDE", "NOITE", "SOS", "RETIRA"]);

export const criarItinerarioSchema = z.object({
  data: z.coerce.date(),
  periodo: periodoEnum.optional(),
  rotaEntregaId: z.string().uuid(),
  transportadoraId: z.string().uuid().optional(),
  placaVeiculo: z.string().trim().max(20).optional(),
});

export const gerarAutomaticoSchema = z.object({
  data: z.coerce.date(),
  periodo: periodoEnum.optional(),
});

export const vincularPedidoSchema = z.object({
  pedidoId: z.string().uuid(),
});

export const atualizarItinerarioSchema = z.object({
  placaVeiculo: z.string().trim().max(20).optional(),
  valorFrete: decimalString().optional(),
});

export const consultarItinerarioQuerySchema = z.object({
  dataInicial: z.coerce.date().optional(),
  dataFinal: z.coerce.date().optional(),
  periodo: periodoEnum.optional(),
  rotaEntregaId: z.string().uuid().optional(),
  transportadoraId: z.string().uuid().optional(),
});

export const gerarFaturaItinerarioSchema = z.object({
  itinerarioIds: z.array(z.string().uuid()).min(1),
});
