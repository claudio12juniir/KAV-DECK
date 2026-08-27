import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { buscarPreapproval, criarPreapproval } from "../../lib/mercadoPago.js";
import { AppError } from "../../utils/AppError.js";

export const VALOR_PONTO_PRINCIPAL = new Prisma.Decimal("5.00");

function addMonths(data, meses) {
  const resultado = new Date(data);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

function emailNormalizado(email) {
  return String(email ?? "").trim().toLowerCase();
}

async function pagamentoAutorizado(preapprovalId, emailEsperado) {
  const preapproval = await buscarPreapproval(preapprovalId);
  const referenciaValida = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    preapproval.external_reference ?? "",
  );
  if (!referenciaValida || preapproval.reason !== "Assinatura KAV DECK") {
    throw new AppError(403, "PAGAMENTO_INVALIDO", "Este pagamento não pertence ao fluxo de cadastro.");
  }
  if (preapproval.status !== "authorized") {
    throw new AppError(402, "PAGAMENTO_NAO_CONFIRMADO", "O pagamento ainda não foi confirmado pelo Mercado Pago.");
  }
  if (emailEsperado && emailNormalizado(preapproval.payer_email) !== emailNormalizado(emailEsperado)) {
    throw new AppError(403, "PAGAMENTO_INVALIDO", "O pagamento não pertence a este e-mail.");
  }
  return preapproval;
}

// Só é chamado depois da confirmação do Mercado Pago. Até este ponto não
// existe Empresa, Usuario, assinatura ou ponto de acesso no banco local.
export async function criarEmpresaEAdmin({ usuarioId, email, razaoSocial, cnpj, nomeAdmin, emailServico, preapprovalId }) {
  const preapproval = await pagamentoAutorizado(preapprovalId, email);

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
      data: {
        id: preapproval.external_reference,
        empresaId: empresa.id,
        status: "ATIVA",
        mpPreapprovalId: String(preapproval.id),
        mpPayerId: preapproval.payer_id ? String(preapproval.payer_id) : null,
        ultimoPagamentoEm: new Date(),
        proximaCobranca: preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : addMonths(new Date(), 1),
      },
    });

    await tx.pontoAcesso.create({
      data: { empresaId: empresa.id, usuarioId: usuario.id, tipo: "PRINCIPAL", valorMensal: VALOR_PONTO_PRINCIPAL, status: "ATIVO" },
    });

    return { empresaId: empresa.id, usuarioId: usuario.id, assinaturaId: assinatura.id };
  });
}

// Gera o checkout sem persistir nenhum dado do candidato no banco local.
// A referência aleatória vira o id da assinatura somente depois do pagamento.
export async function iniciarPagamento({ email, cnpj, backUrl }) {
  const [empresaExistente, usuarioExistente] = await Promise.all([
    prisma.empresa.findUnique({ where: { cnpj }, select: { id: true } }),
    prisma.usuario.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (empresaExistente) throw new AppError(409, "CONFLICT", "Já existe uma empresa cadastrada com este CNPJ.");
  if (usuarioExistente) throw new AppError(409, "CONFLICT", "Já existe um usuário cadastrado com este e-mail.");

  const referenciaExterna = randomUUID();

  const preapproval = await criarPreapproval({
    payerEmail: email,
    valorMensal: VALOR_PONTO_PRINCIPAL,
    referenciaExterna,
    backUrl,
  });

  return { initPoint: preapproval.init_point, preapprovalId: String(preapproval.id) };
}

export async function consultarPagamento({ preapprovalId }) {
  const preapproval = await buscarPreapproval(preapprovalId);
  const referenciaValida = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    preapproval.external_reference ?? "",
  );
  return {
    autorizado: referenciaValida && preapproval.reason === "Assinatura KAV DECK" && preapproval.status === "authorized",
  };
}
