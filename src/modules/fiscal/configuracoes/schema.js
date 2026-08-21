import { z } from "zod";

// Necessários pra criar a Company na NFe.io (ver src/lib/nfeio.js) — sem
// eles a empresa não consegue emitir nota real, só ficar em EM_DIGITACAO.
const enderecoSchema = z.object({
  logradouro: z.string().min(1).max(120),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(60).optional(),
  bairro: z.string().min(1).max(80),
  cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos, sem traço."),
  uf: z.string().length(2),
  cidadeCodigoIbge: z.string().regex(/^\d{7}$/, "Código IBGE do município deve ter 7 dígitos."),
  cidadeNome: z.string().min(1).max(80),
});

export const upsertConfiguracaoFiscalSchema = z.object({
  ambiente: z.enum(["HOMOLOGACAO", "PRODUCAO"]),
  serieNfePadrao: z.string().min(1).max(10),
  serieNfcePadrao: z.string().min(1).max(10),
  cscId: z.string().max(60).optional(),
  cscToken: z.string().max(120).optional(),
  regimeTributario: z.enum(["SimplesNacional", "LucroPresumido", "LucroReal"]).optional(),
  // Exigida pela NFe.io pra liberar emissão de NF-e da Company (ver
  // criarStateTax em src/lib/nfeio.js) — sem ela a emissão falha com "company
  // does not have a state tax configured".
  inscricaoEstadual: z.string().min(1).max(20).optional(),
  endereco: enderecoSchema.optional(),
});
