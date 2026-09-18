import { prisma } from "./prisma.js";

// Histórico genérico por registro (botão "Logs" das telas de cadastro,
// igual ao Space Soft). Nunca deve derrubar a operação principal — um
// cadastro criado/editado/excluído com sucesso não pode falhar por causa
// do log.
export async function registrarLog({ empresaId, entidade, entidadeId, acao, usuarioId, dados }) {
  try {
    await prisma.logAlteracao.create({
      data: { empresaId, entidade, entidadeId, acao, usuarioId, dados },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Falha ao registrar log de ${entidade}/${entidadeId}:`, err);
  }
}

export async function listarLogs({ empresaId, entidade, entidadeId }) {
  return prisma.logAlteracao.findMany({
    where: { empresaId, entidade, entidadeId },
    select: {
      id: true,
      acao: true,
      dados: true,
      criadoEm: true,
      usuario: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
  });
}
