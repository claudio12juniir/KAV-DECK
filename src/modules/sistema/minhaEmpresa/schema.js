import { z } from "zod";

export const atualizarEmpresaSchema = z.object({
  razaoSocial: z.string().trim().min(1).max(200).optional(),
  telefone: z.string().trim().max(20).optional(),
  emailServico: z.string().trim().email().optional(),
  // data URL (data:image/png;base64,...) — o front converte o arquivo antes
  // de mandar; não há upload binário nem storage externo neste sistema.
  logotipoDataUrl: z.string().trim().max(2_000_000).optional(),
});
