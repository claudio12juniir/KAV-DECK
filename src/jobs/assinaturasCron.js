import { prisma } from "../lib/prisma.js";
import { emitEmpresaSuspensa, emitSessaoRevogada } from "../realtime/index.js";

const DIAS_CARENCIA = 10;
const UMA_HORA_MS = 60 * 60 * 1000;

// Empresas INADIMPLENTE há mais de 10 dias (contados a partir de
// dataVencimentoAtual, setado pelo webhook quando um pagamento falha) perdem
// acesso de todos os pontos — sessões já ativas são derrubadas em tempo real
// (emitEmpresaSuspensa), sessões novas já caem no 402 ASSINATURA_SUSPENSA do
// middleware de autenticação (src/middlewares/auth.js).
async function suspenderInadimplentes() {
  const limite = new Date(Date.now() - DIAS_CARENCIA * 24 * 60 * 60 * 1000);

  const empresas = await prisma.assinaturaEmpresa.findMany({
    where: { status: "INADIMPLENTE", dataVencimentoAtual: { lte: limite } },
    select: { empresaId: true },
  });
  if (empresas.length === 0) return;

  await prisma.assinaturaEmpresa.updateMany({
    where: { empresaId: { in: empresas.map((e) => e.empresaId) } },
    data: { status: "SUSPENSA" },
  });

  for (const { empresaId } of empresas) {
    emitEmpresaSuspensa(empresaId, "ACESSO NEGADO! PAGAMENTO EM ATRASO");
  }
}

// Pontos extras cancelados só saem do ar quando o ciclo já pago termina —
// ver dataFimVigencia setado em cancelarPonto (modules/sistema/assinatura).
async function encerrarPontosAgendados() {
  const pontos = await prisma.pontoAcesso.findMany({
    where: { status: "CANCELAMENTO_AGENDADO", dataFimVigencia: { lte: new Date() } },
    select: { id: true, usuarioId: true, usuario: { select: { sessaoAtiva: { select: { sessaoId: true } } } } },
  });
  if (pontos.length === 0) return;

  const pontoIds = pontos.map((p) => p.id);
  const usuarioIds = pontos.map((p) => p.usuarioId).filter(Boolean);
  await prisma.$transaction([
    prisma.pontoAcesso.updateMany({ where: { id: { in: pontoIds } }, data: { status: "ENCERRADO" } }),
    prisma.usuario.updateMany({ where: { id: { in: usuarioIds } }, data: { ativo: false } }),
    prisma.sessaoAtiva.deleteMany({ where: { usuarioId: { in: usuarioIds } } }),
  ]);
  for (const ponto of pontos) {
    if (ponto.usuario?.sessaoAtiva?.sessaoId) {
      emitSessaoRevogada(ponto.usuario.sessaoAtiva.sessaoId, "Seu acesso interno foi encerrado.");
    }
  }
}

export async function rodarCicloAssinaturas() {
  await suspenderInadimplentes();
  await encerrarPontosAgendados();
}

// Roda in-process (sem dependência de cron externo) porque o backend já
// fica sempre ativo no plano Starter do Render — ver DEPLOY.md.
export function iniciarCronAssinaturas() {
  rodarCicloAssinaturas().catch((err) => console.error("Erro no ciclo de assinaturas:", err));
  setInterval(() => {
    rodarCicloAssinaturas().catch((err) => console.error("Erro no ciclo de assinaturas:", err));
  }, UMA_HORA_MS);
}
