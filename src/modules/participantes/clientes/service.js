import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  participanteId: true,
  bloqueioFinanceiro: true,
  vendedorPadraoId: true,
  rotaEntregaId: true,
  tabelaPrecoId: true,
  participante: { select: { razaoSocial: true, cpfCnpj: true, ativo: true } },
};

// Reaproveitado pelo módulo de Vendas para checar bloqueio financeiro antes de criar pedido.
export async function getClienteTenant({ empresaId, participanteId }) {
  const cliente = await prisma.cliente.findFirst({
    where: { participanteId, participante: { empresaId } },
    select: SELECT,
  });
  if (!cliente) throw new AppError(404, "NOT_FOUND", "Cliente não encontrado.");
  return cliente;
}

export async function list({ empresaId, skip, take, q }) {
  const where = {
    participante: {
      empresaId,
      ...(q
        ? {
            OR: [
              { razaoSocial: { contains: q, mode: "insensitive" } },
              { nomeFantasia: { contains: q, mode: "insensitive" } },
              { cpfCnpj: { contains: q } },
            ],
          }
        : {}),
    },
  };
  const [items, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      select: SELECT,
      skip,
      take,
      orderBy: { participante: { razaoSocial: "asc" } },
    }),
    prisma.cliente.count({ where }),
  ]);
  return { items, total };
}

// Atalho de 1 clique (mantido pela tela atual de Clientes): aplica a
// mudança na hora, mas ainda registra um BloqueioFinanceiroCliente já
// AUTORIZADO — quem solicitou e quem autorizou são a mesma pessoa, mas a
// trilha de auditoria continua existindo, só sem passar pelas etapas de
// análise separadas.
export async function updateBloqueio({ empresaId, usuarioId, id, bloqueioFinanceiro }) {
  await getClienteTenant({ empresaId, participanteId: id });

  return prisma.$transaction(async (tx) => {
    await tx.bloqueioFinanceiroCliente.create({
      data: {
        clienteId: id,
        tipo: bloqueioFinanceiro === "BLOQUEADO" ? "BLOQUEAR" : "DESBLOQUEAR",
        status: "AUTORIZADO",
        solicitadoPorId: usuarioId,
        autorizadoPorId: usuarioId,
        decididoEm: new Date(),
      },
    });
    return tx.cliente.update({ where: { participanteId: id }, data: { bloqueioFinanceiro }, select: SELECT });
  });
}

const SELECT_BLOQUEIO = {
  id: true,
  clienteId: true,
  tipo: true,
  status: true,
  motivo: true,
  solicitadoPorId: true,
  autorizadoPorId: true,
  decididoEm: true,
  criadoEm: true,
  solicitadoPor: { select: { nome: true } },
  autorizadoPor: { select: { nome: true } },
};

async function getBloqueioOrThrow({ empresaId, id, bloqueioId }) {
  await getClienteTenant({ empresaId, participanteId: id });
  const bloqueio = await prisma.bloqueioFinanceiroCliente.findFirst({
    where: { id: bloqueioId, clienteId: id },
    select: SELECT_BLOQUEIO,
  });
  if (!bloqueio) throw new AppError(404, "NOT_FOUND", "Solicitação de bloqueio não encontrada.");
  return bloqueio;
}

export async function listarBloqueios({ empresaId, id, skip, take }) {
  await getClienteTenant({ empresaId, participanteId: id });
  const where = { clienteId: id };
  const [items, total] = await Promise.all([
    prisma.bloqueioFinanceiroCliente.findMany({
      where,
      select: SELECT_BLOQUEIO,
      skip,
      take,
      orderBy: { criadoEm: "desc" },
    }),
    prisma.bloqueioFinanceiroCliente.count({ where }),
  ]);
  return { items, total };
}

export async function solicitarBloqueio({ empresaId, usuarioId, id, tipo, motivo }) {
  await getClienteTenant({ empresaId, participanteId: id });
  return prisma.bloqueioFinanceiroCliente.create({
    data: { clienteId: id, tipo, motivo, status: "SOLICITADO", solicitadoPorId: usuarioId },
    select: SELECT_BLOQUEIO,
  });
}

export async function colocarBloqueioEmAnalise({ empresaId, id, bloqueioId }) {
  const bloqueio = await getBloqueioOrThrow({ empresaId, id, bloqueioId });
  if (bloqueio.status !== "SOLICITADO") {
    throw new AppError(409, "BLOQUEIO_NAO_SOLICITADO", "Só uma solicitação recém-aberta pode entrar em análise.");
  }
  return prisma.bloqueioFinanceiroCliente.update({
    where: { id: bloqueioId },
    data: { status: "EM_ANALISE" },
    select: SELECT_BLOQUEIO,
  });
}

export async function autorizarBloqueio({ empresaId, usuarioId, id, bloqueioId }) {
  const bloqueio = await getBloqueioOrThrow({ empresaId, id, bloqueioId });
  if (!["SOLICITADO", "EM_ANALISE"].includes(bloqueio.status)) {
    throw new AppError(409, "BLOQUEIO_NAO_DECIDIVEL", "Esta solicitação já foi decidida.");
  }

  return prisma.$transaction(async (tx) => {
    const atualizado = await tx.bloqueioFinanceiroCliente.update({
      where: { id: bloqueioId },
      data: { status: "AUTORIZADO", autorizadoPorId: usuarioId, decididoEm: new Date() },
      select: SELECT_BLOQUEIO,
    });
    await tx.cliente.update({
      where: { participanteId: id },
      data: { bloqueioFinanceiro: bloqueio.tipo === "BLOQUEAR" ? "BLOQUEADO" : "LIBERADO" },
    });
    return atualizado;
  });
}

export async function negarBloqueio({ empresaId, usuarioId, id, bloqueioId }) {
  const bloqueio = await getBloqueioOrThrow({ empresaId, id, bloqueioId });
  if (!["SOLICITADO", "EM_ANALISE"].includes(bloqueio.status)) {
    throw new AppError(409, "BLOQUEIO_NAO_DECIDIVEL", "Esta solicitação já foi decidida.");
  }
  return prisma.bloqueioFinanceiroCliente.update({
    where: { id: bloqueioId },
    data: { status: "NEGADO", autorizadoPorId: usuarioId, decididoEm: new Date() },
    select: SELECT_BLOQUEIO,
  });
}
