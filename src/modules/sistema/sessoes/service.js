import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";
import { emitSessaoRevogada } from "../../../realtime/index.js";

export async function listar({ empresaId }) {
  return prisma.sessaoAtiva.findMany({
    where: { usuario: { empresaId } },
    select: {
      usuarioId: true,
      dispositivo: true,
      criadaEm: true,
      ultimoAcessoEm: true,
      usuario: { select: { nome: true, email: true, role: true } },
    },
    orderBy: { ultimoAcessoEm: "desc" },
  });
}

export async function revogar({ empresaId, usuarioId }) {
  const sessao = await prisma.sessaoAtiva.findFirst({
    where: { usuarioId, usuario: { empresaId } },
  });
  if (!sessao) {
    throw new AppError(404, "NOT_FOUND", "Este usuário não tem sessão ativa no momento.");
  }

  await prisma.sessaoAtiva.delete({ where: { usuarioId } });
  emitSessaoRevogada(sessao.sessaoId, "Um administrador encerrou sua sessão.");
}
