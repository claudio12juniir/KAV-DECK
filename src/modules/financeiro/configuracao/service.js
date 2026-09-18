import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  contaBancariaPadraoBoletoId: true,
  contaBancariaPadraoBoleto: { select: { id: true, banco: true, agencia: true, conta: true } },
};

export async function obter({ empresaId }) {
  return prisma.empresa.findUniqueOrThrow({ where: { id: empresaId }, select: SELECT });
}

export async function atualizar({ empresaId, contaBancariaPadraoBoletoId }) {
  if (contaBancariaPadraoBoletoId) {
    const conta = await prisma.contaBancaria.findFirst({
      where: { id: contaBancariaPadraoBoletoId, empresaId },
      select: { id: true },
    });
    if (!conta) throw new AppError(422, "INVALID_REFERENCE", "Conta bancária informada não existe.");
  }
  return prisma.empresa.update({
    where: { id: empresaId },
    data: { contaBancariaPadraoBoletoId },
    select: SELECT,
  });
}
