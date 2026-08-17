import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = {
  id: true,
  produtoId: true,
  loteId: true,
  tipo: true,
  quantidade: true,
  motivo: true,
  usuarioId: true,
  pedidoCompraId: true,
  pedidoVendaId: true,
  inventarioFisicoId: true,
  data: true,
  produto: { select: { codigo: true, descricao: true } },
};

export async function list({ empresaId, skip, take, produtoId, loteId }) {
  const where = {
    empresaId,
    ...(produtoId ? { produtoId } : {}),
    ...(loteId ? { loteId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.movimentoEstoque.findMany({ where, select: SELECT, skip, take, orderBy: { data: "desc" } }),
    prisma.movimentoEstoque.count({ where }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const movimento = await prisma.movimentoEstoque.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!movimento) throw new AppError(404, "NOT_FOUND", "Movimento de estoque não encontrado.");
  return movimento;
}

async function ajustarUmItem(tx, { empresaId, usuarioId, loteId, quantidade, motivo }) {
  const lote = await tx.lote.findFirst({
    where: { id: loteId, empresaId },
    select: { id: true, produtoId: true, quantidadeAtual: true },
  });
  if (!lote) throw new AppError(422, "INVALID_REFERENCE", `Lote ${loteId} não existe.`);

  const diferenca = new Prisma.Decimal(quantidade);
  const novoSaldo = new Prisma.Decimal(lote.quantidadeAtual).plus(diferenca);
  if (novoSaldo.isNegative()) {
    throw new AppError(
      409,
      "ESTOQUE_INSUFICIENTE",
      `O ajuste deixaria o saldo do lote ${loteId} negativo.`,
    );
  }

  await tx.lote.update({ where: { id: loteId }, data: { quantidadeAtual: novoSaldo } });

  return tx.movimentoEstoque.create({
    data: {
      empresaId,
      produtoId: lote.produtoId,
      loteId,
      tipo: "AJUSTE_MANUAL",
      quantidade: diferenca,
      motivo,
      usuarioId,
    },
    select: SELECT,
  });
}

export async function ajustar({ empresaId, usuarioId, loteId, quantidade, motivo }) {
  return prisma.$transaction((tx) => ajustarUmItem(tx, { empresaId, usuarioId, loteId, quantidade, motivo }));
}

export async function ajustarLote({ empresaId, usuarioId, itens }) {
  return prisma.$transaction(async (tx) => {
    // Sequencial (não Promise.all): se o mesmo lote aparecer duas vezes no
    // lote de ajustes, cada ajuste precisa enxergar o saldo já atualizado
    // pelo anterior.
    const resultados = [];
    for (const item of itens) {
      resultados.push(await ajustarUmItem(tx, { empresaId, usuarioId, ...item }));
    }
    return resultados;
  });
}
