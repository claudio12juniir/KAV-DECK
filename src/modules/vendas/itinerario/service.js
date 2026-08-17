import { prisma } from "../../../lib/prisma.js";

// Não existe um campo de "data de entrega" separado da emissão no pedido —
// o roteiro do dia usa dataEmissao como proxy (mesma convenção já usada em
// Prévia do Estoque e Estoque Faturado). Agrupa por rota e depois por
// turno, já que é assim que o separador/entregador enxerga o dia: uma rota,
// vários turnos, pedidos dentro de cada um.
export async function consultar({ empresaId, data, turno, rotaEntregaId }) {
  const inicioDoDia = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  const fimDoDia = new Date(inicioDoDia.getTime() + 24 * 60 * 60 * 1000);

  const pedidos = await prisma.pedidoVenda.findMany({
    where: {
      empresaId,
      status: "FATURADO",
      dataEmissao: { gte: inicioDoDia, lt: fimDoDia },
      rotaEntregaId: { not: null },
      ...(turno ? { turno } : {}),
      ...(rotaEntregaId ? { rotaEntregaId } : {}),
    },
    select: {
      id: true,
      turno: true,
      rotaEntregaId: true,
      dataEmissao: true,
      cliente: { select: { participante: { select: { razaoSocial: true } } } },
      rotaEntrega: { select: { id: true, nome: true } },
    },
    orderBy: [{ rotaEntregaId: "asc" }, { turno: "asc" }],
  });

  const porRota = new Map();
  for (const pedido of pedidos) {
    const chave = pedido.rotaEntregaId;
    if (!porRota.has(chave)) {
      porRota.set(chave, { rotaEntregaId: chave, rota: pedido.rotaEntrega.nome, turnos: new Map() });
    }
    const entradaRota = porRota.get(chave);
    const turnoChave = pedido.turno ?? "SEM_TURNO";
    if (!entradaRota.turnos.has(turnoChave)) entradaRota.turnos.set(turnoChave, []);
    entradaRota.turnos.get(turnoChave).push({
      pedidoId: pedido.id,
      cliente: pedido.cliente.participante.razaoSocial,
    });
  }

  return [...porRota.values()].map((entrada) => ({
    rotaEntregaId: entrada.rotaEntregaId,
    rota: entrada.rota,
    turnos: [...entrada.turnos.entries()].map(([turnoChave, pedidosDoTurno]) => ({
      turno: turnoChave,
      pedidos: pedidosDoTurno,
    })),
  }));
}
