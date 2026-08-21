import { z } from "zod";

export const createCertificadoDigitalSchema = z.object({
  nome: z.string().min(1).max(120),
  dataVencimento: z.coerce.date(),
});

export const updateCertificadoDigitalSchema = createCertificadoDigitalSchema.partial();

export const uploadCertificadoDigitalSchema = z.object({
  senha: z.string().min(1, "Senha do certificado (.pfx) é obrigatória."),
});
