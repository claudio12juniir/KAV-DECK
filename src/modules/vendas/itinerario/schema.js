import { z } from "zod";

export const consultarItinerarioQuerySchema = z.object({
  data: z.coerce.date(),
  turno: z.enum(["MANHA", "TARDE", "NOITE", "SOS", "RETIRA"]).optional(),
  rotaEntregaId: z.string().uuid().optional(),
});
