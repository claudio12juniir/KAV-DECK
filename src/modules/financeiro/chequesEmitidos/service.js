import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  contaBancariaId: true,
  numero: true,
  valor: true,
  dataEmissao: true,
  dataCompensacao: true,
  status: true,
};

async function getChequeOrThrow({ empresaId, id }) {
  const cheque = await prisma.chequeEmitido.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!cheque) throw new AppError(404, "NOT_FOUND", "Cheque emitido não encontrado.");
  return cheque;
}

export async function list({ empresaId, skip, take, status }) {
  const where = { empresaId, ...(status ? { status } : {}) };
  const [items, total] = await Promise.all([
    prisma.chequeEmitido.findMany({ where, select: SELECT, skip, take, orderBy: { dataEmissao: "desc" } }),
    prisma.chequeEmitido.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  return getChequeOrThrow({ empresaId, id });
}

export async function create({ empresaId, data }) {
  const contaBancaria = await prisma.contaBancaria.findFirst({
    where: { id: data.contaBancariaId, empresaId },
    select: { id: true },
  });
  if (!contaBancaria) throw new AppError(422, "INVALID_REFERENCE", "Conta bancária informada não existe.");

  return prisma.chequeEmitido.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function updateStatus({ empresaId, id, status, dataCompensacao }) {
  const cheque = await getChequeOrThrow({ empresaId, id });
  if (cheque.status !== "EM_CARTEIRA") {
    throw new AppError(409, "CHEQUE_JA_PROCESSADO", "Este cheque já foi compensado ou devolvido.");
  }

  return prisma.chequeEmitido.update({
    where: { id },
    data: { status, dataCompensacao: dataCompensacao ?? new Date() },
    select: SELECT,
  });
}
