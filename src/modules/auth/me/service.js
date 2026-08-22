import { prisma } from "../../../lib/prisma.js";
import { emitSessaoRevogada } from "../../../realtime/index.js";
import { AppError } from "../../../utils/AppError.js";

const PONTOS_UTILIZAVEIS = { in: ["ATIVO", "CANCELAMENTO_AGENDADO"] };

// Quantas sessões de usuários distintos da empresa estão ocupadas agora vs.
// quantos pontos de acesso ela tem pra oferecer — não importa qual Usuario
// está em qual ponto, o limite é da empresa como um todo (ver
// prisma/schema.prisma:PontoAcesso e claude.md / plano da Sprint 11).
async function limiteDeAcessos(empresaId) {
  const [ocupacaoAtual, pontosUtilizaveis] = await Promise.all([
    prisma.sessaoAtiva.count({ where: { usuario: { empresaId } } }),
    prisma.pontoAcesso.count({ where: { empresaId, status: PONTOS_UTILIZAVEIS } }),
  ]);
  return { ocupacaoAtual, pontosUtilizaveis };
}

// Upsert por usuarioId (chave única em SessaoAtiva) — é o que garante "1
// dispositivo por vez": reivindicar substitui a sessão anterior em vez de
// coexistir com ela. Se havia uma sessão anterior diferente, avisa o
// dispositivo antigo em tempo real antes de ele levar 401 na próxima
// chamada (ver src/middlewares/auth.js:checarSessaoUnica).
export async function claimSessao({ usuarioId, empresaId, sessaoId, dispositivo }) {
  const anterior = await prisma.sessaoAtiva.findUnique({
    where: { usuarioId },
    select: { sessaoId: true },
  });

  // Só conta contra o limite quando este usuário ainda não ocupa nenhum
  // ponto — reclamar a própria sessão de outro dispositivo move o mesmo
  // slot, não abre um novo.
  if (!anterior) {
    const { ocupacaoAtual, pontosUtilizaveis } = await limiteDeAcessos(empresaId);
    if (ocupacaoAtual >= pontosUtilizaveis) {
      throw new AppError(
        409,
        "LIMITE_ACESSOS_ATINGIDO",
        "Limite de acessos atingido — compre mais pontos ou aguarde alguém sair.",
      );
    }
  }

  const sessao = await prisma.sessaoAtiva.upsert({
    where: { usuarioId },
    update: { sessaoId, dispositivo, ultimoAcessoEm: new Date() },
    create: { usuarioId, sessaoId, dispositivo },
  });

  if (anterior && anterior.sessaoId !== sessaoId) {
    emitSessaoRevogada(anterior.sessaoId, "Você entrou em outro dispositivo.");
  }

  return sessao;
}

// Logout explícito: só apaga se o sessaoId bater com o que está salvo, pra
// uma aba com sessão já revogada não conseguir apagar por engano a sessão
// nova que substituiu a dela.
export async function releaseSessao({ usuarioId, sessaoId }) {
  if (!sessaoId) return;
  await prisma.sessaoAtiva.deleteMany({ where: { usuarioId, sessaoId } });
}
