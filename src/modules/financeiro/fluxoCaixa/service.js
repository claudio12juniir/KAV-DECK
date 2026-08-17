import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

function chaveData(data) {
  return new Date(data).toISOString().slice(0, 10);
}

// Projeção simples: soma os títulos ainda em aberto (a pagar e a receber)
// por dia de vencimento dentro do período pedido. Não grava nada — é só
// leitura agregada sobre TituloFinanceiro, igual descrito no roteiro.
export async function projetar({ empresaId, dataInicial, dataFinal }) {
  if (dataInicial > dataFinal) {
    throw new AppError(422, "PERIODO_INVALIDO", "A data inicial não pode ser depois da data final.");
  }

  const titulos = await prisma.tituloFinanceiro.findMany({
    where: { empresaId, status: "ABERTO", vencimento: { gte: dataInicial, lte: dataFinal } },
    select: { tipo: true, valor: true, vencimento: true },
  });

  const porData = new Map();
  for (const titulo of titulos) {
    const chave = chaveData(titulo.vencimento);
    if (!porData.has(chave)) {
      porData.set(chave, { entradas: new Prisma.Decimal(0), saidas: new Prisma.Decimal(0) });
    }
    const bucket = porData.get(chave);
    if (titulo.tipo === "RECEBER") bucket.entradas = bucket.entradas.plus(titulo.valor);
    else bucket.saidas = bucket.saidas.plus(titulo.valor);
  }

  let acumulado = new Prisma.Decimal(0);
  const dias = [...porData.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([data, { entradas, saidas }]) => {
      const saldoDia = entradas.minus(saidas);
      acumulado = acumulado.plus(saldoDia);
      return {
        data,
        entradas: entradas.toFixed(2),
        saidas: saidas.toFixed(2),
        saldoDia: saldoDia.toFixed(2),
        saldoAcumulado: acumulado.toFixed(2),
      };
    });

  const totais = titulos.reduce(
    (soma, titulo) => {
      if (titulo.tipo === "RECEBER") soma.entradas = soma.entradas.plus(titulo.valor);
      else soma.saidas = soma.saidas.plus(titulo.valor);
      return soma;
    },
    { entradas: new Prisma.Decimal(0), saidas: new Prisma.Decimal(0) },
  );

  return {
    periodo: { dataInicial: chaveData(dataInicial), dataFinal: chaveData(dataFinal) },
    dias,
    totais: {
      entradas: totais.entradas.toFixed(2),
      saidas: totais.saidas.toFixed(2),
      saldo: totais.entradas.minus(totais.saidas).toFixed(2),
    },
  };
}
