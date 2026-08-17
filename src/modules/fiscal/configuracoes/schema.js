import { z } from "zod";

export const upsertConfiguracaoFiscalSchema = z.object({
  ambiente: z.enum(["HOMOLOGACAO", "PRODUCAO"]),
  serieNfePadrao: z.string().min(1).max(10),
  serieNfcePadrao: z.string().min(1).max(10),
  cscId: z.string().max(60).optional(),
  cscToken: z.string().max(120).optional(),
});
