import { prisma } from "../../../lib/prisma.js";
import { emitSessaoRevogada } from "../../../realtime/index.js";

// Upsert por usuarioId (chave única em SessaoAtiva) — é o que garante "1
// dispositivo por vez": reivindicar substitui a sessão anterior em vez de
// coexistir com ela. Se havia uma sessão anterior diferente, avisa o
// dispositivo antigo em tempo real antes de ele levar 401 na próxima
// chamada (ver src/middlewares/auth.js:checarSessaoUnica).
export async function claimSessao({ usuarioId, sessaoId, dispositivo }) {
  const anterior = await prisma.sessaoAtiva.findUnique({
    where: { usuarioId },
    select: { sessaoId: true },
  });

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
