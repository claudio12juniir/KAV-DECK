import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

export async function faturamento({ empresaId, ano }) {
  const inicio = new Date(Date.UTC(ano, 0, 1));
  const fim = new Date(Date.UTC(ano + 1, 0, 1));

  const pedidos = await prisma.pedidoVenda.findMany({
    where: { empresaId, status: "FATURADO", dataEmissao: { gte: inicio, lt: fim } },
    select: {
      dataEmissao: true,
      itens: { select: { quantidade: true, precoUnitario: true, desconto: true } },
    },
  });

  const porMes = Array.from({ length: 12 }, () => new Prisma.Decimal(0));
  for (const pedido of pedidos) {
    const mes = pedido.dataEmissao.getUTCMonth();
    const valorPedido = pedido.itens.reduce(
      (soma, item) => soma.plus(new Prisma.Decimal(item.quantidade).times(item.precoUnitario).minus(item.desconto ?? 0)),
      new Prisma.Decimal(0),
    );
    porMes[mes] = porMes[mes].plus(valorPedido);
  }

  const meses = porMes.map((valor, index) => ({ mes: index + 1, valor: valor.toFixed(2) }));
  const total = porMes.reduce((soma, valor) => soma.plus(valor), new Prisma.Decimal(0));
  return { ano, meses, total: total.toFixed(2) };
}

export async function titulosAnual({ empresaId, anos }) {
  const resultado = [];
  for (const ano of anos) {
    const inicio = new Date(Date.UTC(ano, 0, 1));
    const fim = new Date(Date.UTC(ano + 1, 0, 1));
    // eslint-disable-next-line no-await-in-loop
    const [pagar, receber] = await Promise.all([
      prisma.tituloFinanceiro.aggregate({
        where: { empresaId, tipo: "PAGAR", vencimento: { gte: inicio, lt: fim } },
        _sum: { valor: true },
      }),
      prisma.tituloFinanceiro.aggregate({
        where: { empresaId, tipo: "RECEBER", vencimento: { gte: inicio, lt: fim } },
        _sum: { valor: true },
      }),
    ]);
    resultado.push({
      ano,
      totalPagar: (pagar._sum.valor ?? new Prisma.Decimal(0)).toFixed(2),
      totalReceber: (receber._sum.valor ?? new Prisma.Decimal(0)).toFixed(2),
    });
  }
  return resultado;
}
