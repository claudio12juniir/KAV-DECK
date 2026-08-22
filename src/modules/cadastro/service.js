import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { criarPreapproval } from "../../lib/mercadoPago.js";
import { AppError } from "../../utils/AppError.js";

export const VALOR_PONTO_PRINCIPAL = new Prisma.Decimal("180.00");

// Cria a Empresa + o Usuario ADMIN fundador (id = uuid do Supabase Auth,
// exatamente como o middleware de autenticação normal exige) + o ponto
// principal (R$180, permanente) + a assinatura ainda AGUARDANDO_PAGAMENTO —
// só vira ATIVA quando o webhook confirmar a autorização no Mercado Pago
// (ver iniciarPagamento abaixo e webhookMercadoPago.js).
export async function criarEmpresaEAdmin({ usuarioId, email, razaoSocial, cnpj, nomeAdmin, emailServico }) {
  const usuarioExistente = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (usuarioExistente) {
    throw new AppError(409, "CONFLICT", "Esta conta já está vinculada a uma empresa.");
  }

  const empresaExistente = await prisma.empresa.findUnique({ where: { cnpj } });
  if (empresaExistente) {
    throw new AppError(409, "CONFLICT", "Já existe uma empresa cadastrada com este CNPJ.");
  }

  return prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: { razaoSocial, cnpj, emailServico: emailServico ?? email },
    });

    const usuario = await tx.usuario.create({
      data: { id: usuarioId, empresaId: empresa.id, nome: nomeAdmin, email, role: "ADMIN" },
    });

    const assinatura = await tx.assinaturaEmpresa.create({
      data: { empresaId: empresa.id, status: "AGUARDANDO_PAGAMENTO" },
    });

    await tx.pontoAcesso.create({
      data: { empresaId: empresa.id, tipo: "PRINCIPAL", valorMensal: VALOR_PONTO_PRINCIPAL, status: "ATIVO" },
    });

    return { empresaId: empresa.id, usuarioId: usuario.id, assinaturaId: assinatura.id };
  });
}

// Cria a assinatura no Mercado Pago e devolve o link do checkout hospedado
// (init_point) — é lá que o cliente confirma o cartão, não no nosso
// formulário (ver comentário em lib/mercadoPago.js sobre a limitação da
// ativação 100% via API neste sandbox). A AssinaturaEmpresa só vira ATIVA
// quando o webhook confirmar a autorização (ver webhookMercadoPago.js).
export async function iniciarPagamento({ usuarioId, backUrl }) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { empresaId: true, email: true },
  });
  if (!usuario) {
    throw new AppError(404, "NOT_FOUND", "Cadastro de empresa não encontrado para este usuário.");
  }

  const assinatura = await prisma.assinaturaEmpresa.findUnique({ where: { empresaId: usuario.empresaId } });
  if (!assinatura) {
    throw new AppError(404, "NOT_FOUND", "Assinatura não encontrada.");
  }
  if (assinatura.status === "ATIVA") {
    throw new AppError(409, "CONFLICT", "Esta assinatura já está ativa.");
  }

  const preapproval = await criarPreapproval({
    payerEmail: usuario.email,
    valorMensal: VALOR_PONTO_PRINCIPAL,
    referenciaExterna: assinatura.id,
    backUrl,
  });

  await prisma.assinaturaEmpresa.update({
    where: { empresaId: usuario.empresaId },
    data: { mpPreapprovalId: String(preapproval.id) },
  });

  return { initPoint: preapproval.init_point };
}
