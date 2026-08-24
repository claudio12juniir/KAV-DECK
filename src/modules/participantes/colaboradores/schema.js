import { z } from "zod";

const valorMonetario = z.coerce.number().min(0).optional();

// Trata "" como ausente antes de validar — o modal de cadastro genérico
// (SimpleCrudManager) manda string vazia pra todo campo opcional não
// preenchido, não omite a chave; sem isso um cadastro sem CPF preenchido
// falharia a validação em vez de simplesmente não gravar o campo.
function vazioComoAusente(schema) {
  return z.preprocess((v) => (v === "" || v === null ? undefined : v), schema.optional());
}

// Só dígitos, 11 posições (CPF de pessoa física) — mesmo nível de validação
// usado pra cpfCnpj em Participante (sem cálculo de dígito verificador em
// lugar nenhum do sistema hoje, não é o padrão estabelecido).
const cpf = vazioComoAusente(
  z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11, { message: "CPF precisa ter 11 dígitos." }),
);

export const createColaboradorSchema = z.object({
  nome: z.string().min(1).max(120),
  tipo: z.enum(["COMPRADOR", "VENDEDOR", "REPRESENTANTE", "SEPARADOR"]),
  ativo: z.boolean().optional(),
  cpf,
  telefone: vazioComoAusente(z.string().trim().min(8).max(20)),
  dataAdmissao: vazioComoAusente(z.coerce.date()),
  valorSalario: valorMonetario,
  valorValeAlimentacao: valorMonetario,
  valorValeTransporte: valorMonetario,
  valorInss: valorMonetario,
  valorOutrosEncargos: valorMonetario,
});

export const updateColaboradorSchema = createColaboradorSchema.partial();
