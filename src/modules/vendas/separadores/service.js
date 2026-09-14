import { prisma } from "../../../lib/prisma.js";

// Quadro kanban do Terminal de Separadores (mapeamento SpaceSoft seção 12):
// uma coluna por dia, um cartão por pedido pendente de separação naquele
// dia. `separadorId` ausente = balde "Sem Separador" (padrão, pedidos ainda
// não atribuídos a ninguém) — mesma convenção da tela de origem.
export async function kanban({ empresaId, separadorId, dataInicial, dataFinal }) {
  const where = {
    empresaId,
    arquivado: false,
    status: { in: ["ABERTO", "SEPARACAO"] },
    separadorId: separadorId ?? null,
    ...(dataInicial || dataFinal
      ? { dataEmissao: { ...(dataInicial ? { gte: dataInicial } : {}), ...(dataFinal ? { lte: dataFinal } : {}) } }
      : {}),
  };

  const pedidos = await prisma.pedidoVenda.findMany({
    where,
    select: {
      id: true,
      dataEmissao: true,
      status: true,
      cliente: { select: { participante: { select: { razaoSocial: true } } } },
    },
    orderBy: { dataEmissao: "asc" },
  });

  const porDia = new Map();
  for (const pedido of pedidos) {
    const chave = pedido.dataEmissao.toISOString().slice(0, 10);
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave).push({
      pedidoId: pedido.id,
      status: pedido.status,
      cliente: pedido.cliente.participante.razaoSocial,
    });
  }

  return [...porDia.entries()].map(([data, pedidosDoDia]) => ({ data, pedidos: pedidosDoDia }));
}
