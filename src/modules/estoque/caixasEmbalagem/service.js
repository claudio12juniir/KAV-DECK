import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, nome: true, capacidade: true, criadoEm: true };

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.tipoCaixaEmbalagem.findMany({
      where: { empresaId },
      select: SELECT,
      skip,
      take,
      orderBy: { nome: "asc" },
    }),
    prisma.tipoCaixaEmbalagem.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const tipo = await prisma.tipoCaixaEmbalagem.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!tipo) throw new AppError(404, "NOT_FOUND", "Tipo de caixa/embalagem não encontrado.");
  return tipo;
}

export async function create({ empresaId, data }) {
  return prisma.tipoCaixaEmbalagem.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.tipoCaixaEmbalagem.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.tipoCaixaEmbalagem.delete({ where: { id } });
}

export async function registrarMovimento({ empresaId, tipoCaixaEmbalagemId, data }) {
  await getById({ empresaId, id: tipoCaixaEmbalagemId });

  const participante = await prisma.participante.findFirst({
    where: { id: data.participanteId, empresaId },
    select: { id: true },
  });
  if (!participante) throw new AppError(422, "INVALID_REFERENCE", "Participante informado não existe.");

  return prisma.movimentoComodato.create({
    data: { ...data, empresaId, tipoCaixaEmbalagemId },
    select: { id: true, participanteId: true, tipo: true, quantidade: true, data: true },
  });
}
