import { z } from "zod";

export const usuarioIdParamSchema = z.object({ usuarioId: z.string().uuid() });

export const permissaoParamSchema = z.object({
  usuarioId: z.string().uuid(),
  modulo: z.string().min(1),
  acao: z.string().min(1),
});

export const upsertPermissaoSchema = z.object({
  modulo: z.string().min(1),
  acao: z.string().min(1),
  permitida: z.boolean(),
});

export const redefinirSenhaSchema = z.object({
  novaSenha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});
