import { prisma } from "../../../lib/prisma.js";
import { emitSessaoRevogada } from "../../../realtime/index.js";
import { AppError } from "../../../utils/AppError.js";

const PONTOS_UTILIZAVEIS = ["ATIVO", "CANCELAMENTO_AGENDADO"];

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

  const acesso = await prisma.pontoAcesso.findFirst({
    where: { empresaId, usuarioId, status: { in: PONTOS_UTILIZAVEIS } },
    select: { id: true },
  });
  if (!acesso) {
    throw new AppError(403, "ACESSO_INTERNO_INATIVO", "Este usuário não possui um acesso interno ativo nesta empresa.");
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

// `aal` chega do middleware (req.supabaseAal, lido direto do JWT) — exigir
// aal2 aqui é o que garante que ninguém liga `mfaAtivo` sem ter de fato
// acabado de confirmar um código TOTP válido no Supabase (ver
// web/src/features/auth/MinhaContaPage.jsx, que chama mfa.enroll +
// mfa.challengeAndVerify antes de chamar este endpoint).
export async function ativarMfa({ usuarioId, aal }) {
  if (aal !== "aal2") {
    throw new AppError(
      409,
      "MFA_SEM_DESAFIO_CONFIRMADO",
      "Confirme o código do aplicativo autenticador antes de ativar o 2FA.",
    );
  }
  await prisma.usuario.update({ where: { id: usuarioId }, data: { mfaAtivo: true } });
}

// Só desliga nosso sinalizador — remover o fator TOTP em si acontece no
// Supabase pelo próprio client (supabase.auth.mfa.unenroll), antes desta
// chamada. Sem exigir aal2: é exatamente o caminho de recuperação de quem
// perdeu o aplicativo autenticador e por isso nunca mais consegue chegar a
// aal2 sozinho (ver também a versão de admin em
// src/modules/sistema/controleAcesso/service.js:desativarMfa).
export async function desativarMfa({ usuarioId }) {
  await prisma.usuario.update({ where: { id: usuarioId }, data: { mfaAtivo: false } });
}
