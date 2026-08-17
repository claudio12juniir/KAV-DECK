import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT_HEADER = { id: true, data: true, responsavelId: true, criadoEm: true };

const SELECT_DETAIL = {
  ...SELECT_HEADER,
  itens: {
    select: {
      id: true,
      produtoId: true,
      loteId: true,
      quantidadeContada: true,
      quantidadeSistema: true,
      produto: { select: { codigo: true, descricao: true } },
    },
  },
};

async function ensureResponsavel({ empresaId, responsavelId }) {
  if (!responsavelId) return;
  const responsavel = await prisma.colaborador.findFirst({
    where: { id: responsavelId, empresaId },
    select: { id: true },
  });
  if (!responsavel) throw new AppError(422, "INVALID_REFERENCE", "Colaborador responsável informado não existe.");
}

async function getInventarioOrThrow({ empresaId, id, select = SELECT_DETAIL }) {
  const inventario = await prisma.inventarioFisico.findFirst({ where: { id, empresaId }, select });
  if (!inventario) throw new AppError(404, "NOT_FOUND", "Inventário físico não encontrado.");
  return inventario;
}

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.inventarioFisico.findMany({
      where: { empresaId },
      select: SELECT_HEADER,
      skip,
      take,
      orderBy: { data: "desc" },
    }),
    prisma.inventarioFisico.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  return getInventarioOrThrow({ empresaId, id });
}

export async function create({ empresaId, data }) {
  const { responsavelId, itens } = data;

  await ensureResponsavel({ empresaId, responsavelId });

  const lotes = await prisma.lote.findMany({
    where: { id: { in: itens.map((item) => item.loteId) }, empresaId },
    select: { id: true, produtoId: true, quantidadeAtual: true },
  });
  const loteById = new Map(lotes.map((lote) => [lote.id, lote]));

  const itensCreate = itens.map((item) => {
    const lote = loteById.get(item.loteId);
    if (!lote) throw new AppError(422, "INVALID_REFERENCE", `Lote ${item.loteId} não existe.`);
    return {
      loteId: item.loteId,
      produtoId: lote.produtoId,
      quantidadeContada: item.quantidadeContada,
      quantidadeSistema: lote.quantidadeAtual,
    };
  });

  return prisma.inventarioFisico.create({
    data: { empresaId, responsavelId, itens: { create: itensCreate } },
    select: SELECT_DETAIL,
  });
}

export async function fechar({ empresaId, id }) {
  const inventario = await getInventarioOrThrow({ empresaId, id });

  const jaFechado = await prisma.movimentoEstoque.findFirst({
    where: { inventarioFisicoId: id },
    select: { id: true },
  });
  if (jaFechado) throw new AppError(409, "INVENTARIO_JA_FECHADO", "Este inventário já foi fechado.");

  const ajustes = inventario.itens.filter(
    (item) => !new Prisma.Decimal(item.quantidadeContada).equals(item.quantidadeSistema),
  );

  await prisma.$transaction(async (tx) => {
    for (const item of ajustes) {
      const diferenca = new Prisma.Decimal(item.quantidadeContada).minus(item.quantidadeSistema);

      await tx.movimentoEstoque.create({
        data: {
          empresaId,
          produtoId: item.produtoId,
          loteId: item.loteId,
          tipo: "AJUSTE_INVENTARIO",
          quantidade: diferenca,
          inventarioFisicoId: id,
        },
      });

      await tx.lote.update({
        where: { id: item.loteId },
        data: { quantidadeAtual: item.quantidadeContada },
      });
    }
  });

  return { id, ajustesAplicados: ajustes.length };
}
