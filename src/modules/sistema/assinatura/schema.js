import { z } from "zod";

export const pontoIdParamSchema = z.object({ pontoId: z.string().uuid() });

export const comprarAcessoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  role: z.enum(["FUNCIONARIO", "ADMIN"]),
});

export const trocarCartaoSchema = z.object({ cardTokenId: z.string().min(1) });
