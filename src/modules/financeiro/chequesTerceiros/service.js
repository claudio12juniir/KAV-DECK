import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  participanteId: true,
  numero: true,
  valor: true,
  dataRecebimento: true,
  dataCompensacao: true,
  status: true,
};

async function getChequeOrThrow({ empresaId, id }) {
  const cheque = await prisma.chequeTerceiro.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!cheque) throw new AppError(404, "NOT_FOUND", "Cheque de terceiro não encontrado.");
  return cheque;
}

export async function list({ empresaId, skip, take, status }) {
  const where = { empresaId, ...(status ? { status } : {}) };
  const [items, total] = await Promise.all([
    prisma.chequeTerceiro.findMany({ where, select: SELECT, skip, take, orderBy: { dataRecebimento: "desc" } }),
    prisma.chequeTerceiro.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  return getChequeOrThrow({ empresaId, id });
}

export async function create({ empresaId, data }) {
  const participante = await prisma.participante.findFirst({
    where: { id: data.participanteId, empresaId },
    select: { id: true },
  });
  if (!participante) throw new AppError(422, "INVALID_REFERENCE", "Participante informado não existe.");

  return prisma.chequeTerceiro.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function updateStatus({ empresaId, id, status, dataCompensacao }) {
  const cheque = await getChequeOrThrow({ empresaId, id });
  if (cheque.status !== "EM_CARTEIRA") {
    throw new AppError(409, "CHEQUE_JA_PROCESSADO", "Este cheque já foi compensado ou devolvido.");
  }

  return prisma.chequeTerceiro.update({
    where: { id },
    data: { status, dataCompensacao: dataCompensacao ?? new Date() },
    select: SELECT,
  });
}
