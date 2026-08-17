import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import * as titulosService from "../../financeiro/titulos/service.js";

async function titulosAbertosProdutorRural({ empresaId, transportadoraId, dataInicial, dataFinal }) {
  return prisma.tituloFinanceiro.findMany({
    where: {
      empresaId,
      tipo: "PAGAR",
      status: "ABERTO",
      pedidoCompra: {
        fornecedor: { participante: { isProdutorRural: true } },
        ...(transportadoraId ? { transportadoraId } : {}),
        ...(dataInicial || dataFinal
          ? { dataEmissao: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
          : {}),
      },
    },
    select: {
      id: true,
      participanteId: true,
      valor: true,
      vencimento: true,
      numero: true,
      participante: { select: { razaoSocial: true } },
      baixas: { select: { id: true } },
    },
  });
}

// Fechamento por transportadora/período: agrupa (por fornecedor produtor
// rural) os títulos a pagar já gerados no recebimento de cada pedido —
// não cria título novo por conta própria, só consolida o que já existe.
export async function consultar({ empresaId, transportadoraId, dataInicial, dataFinal }) {
  const titulos = await titulosAbertosProdutorRural({ empresaId, transportadoraId, dataInicial, dataFinal });
  const semBaixa = titulos.filter((t) => t.baixas.length === 0);

  const porFornecedor = new Map();
  for (const titulo of semBaixa) {
    const chave = titulo.participanteId;
    if (!porFornecedor.has(chave)) {
      porFornecedor.set(chave, {
        fornecedorId: chave,
        razaoSocial: titulo.participante.razaoSocial,
        valorAPagar: new Prisma.Decimal(0),
        tituloIds: [],
      });
    }
    const entrada = porFornecedor.get(chave);
    entrada.valorAPagar = entrada.valorAPagar.plus(titulo.valor);
    entrada.tituloIds.push(titulo.id);
  }

  return [...porFornecedor.values()].map((entrada) => ({ ...entrada, valorAPagar: entrada.valorAPagar.toFixed(2) }));
}

// Pra cada fornecedor com mais de um título em aberto no período, consolida
// em um só (reaproveita titulos.agrupar do Sprint 3); com um único título,
// não há o que agrupar — ele já É a fatura.
export async function gerar({ empresaId, transportadoraId, dataInicial, dataFinal }) {
  const grupos = await consultar({ empresaId, transportadoraId, dataInicial, dataFinal });
  const resultado = [];
  for (const grupo of grupos) {
    if (grupo.tituloIds.length > 1) {
      // eslint-disable-next-line no-await-in-loop
      const consolidado = await titulosService.agrupar({ empresaId, tituloIds: grupo.tituloIds });
      resultado.push(consolidado);
    } else if (grupo.tituloIds.length === 1) {
      // eslint-disable-next-line no-await-in-loop
      const titulo = await prisma.tituloFinanceiro.findUnique({ where: { id: grupo.tituloIds[0] } });
      resultado.push(titulo);
    }
  }
  return resultado;
}
