import { prisma } from "../lib/prisma.js";
import { enviarEmail } from "../lib/mailer.js";
import { emitEmpresaSuspensa, emitSessaoRevogada } from "../realtime/index.js";
import { gerarFaturaCicloAtual } from "../modules/sistema/assinatura/service.js";

const DIAS_CARENCIA = 10;
const UMA_HORA_MS = 60 * 60 * 1000;

// Empresas INADIMPLENTE há mais de 10 dias (contados a partir de
// dataVencimentoAtual, setado pelo webhook quando um pagamento falha, ou por
// marcarFaturasVencidas quando uma fatura pix/boleto expira sem pagamento)
// perdem acesso de todos os pontos — sessões já ativas são derrubadas em
// tempo real (emitEmpresaSuspensa), sessões novas já caem no 402
// ASSINATURA_SUSPENSA do middleware de autenticação (src/middlewares/auth.js).
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

// PIX e boleto não têm cobrança recorrente nativa no Mercado Pago — quando o
// ciclo vigente chega (proximaCobranca no passado) e não há fatura pendente,
// gera a próxima na hora. Cartão não passa por aqui: a cobrança automática
// já é feita pelo próprio MP, e o webhook (tratarPagamento) avança
// proximaCobranca sozinho a cada cobrança aprovada.
async function gerarFaturasRecorrentes() {
  const assinaturas = await prisma.assinaturaEmpresa.findMany({
    where: {
      status: "ATIVA",
      formaPagamento: { in: ["PIX", "BOLETO"] },
      faturaMpPaymentId: null,
      proximaCobranca: { lte: new Date() },
    },
    select: { empresaId: true },
  });
  for (const { empresaId } of assinaturas) {
    await gerarFaturaCicloAtual({ empresaId }).catch((err) =>
      console.error("Erro ao gerar fatura recorrente:", empresaId, err),
    );
  }
}

// Fatura pix/boleto vencida sem pagamento não gera webhook de "rejeitado"
// sozinha (diferente do cartão, que o MP tenta cobrar e avisa o resultado) —
// por isso essa checagem existe: sem ela, uma fatura ignorada deixaria a
// assinatura presa em ATIVA pra sempre.
async function marcarFaturasVencidas() {
  const assinaturas = await prisma.assinaturaEmpresa.findMany({
    where: {
      status: "ATIVA",
      formaPagamento: { in: ["PIX", "BOLETO"] },
      faturaMpPaymentId: { not: null },
      faturaVencimento: { lte: new Date() },
    },
  });
  for (const assinatura of assinaturas) {
    await prisma.assinaturaEmpresa.update({
      where: { id: assinatura.id },
      data: { status: "INADIMPLENTE", dataVencimentoAtual: assinatura.faturaVencimento },
    });
  }
}

// Um aviso só, no momento em que a assinatura entra em INADIMPLENTE (não a
// cada hora que o cron roda) — avisoAtrasoEnviadoEm é limpo de volta pra
// null assim que o pagamento é confirmado (ver webhookMercadoPago.js), então
// um novo atraso num ciclo futuro dispara um novo aviso normalmente.
async function avisarAtrasados() {
  const assinaturas = await prisma.assinaturaEmpresa.findMany({
    where: { status: "INADIMPLENTE", avisoAtrasoEnviadoEm: null },
    include: {
      empresa: { select: { razaoSocial: true, usuarios: { where: { role: "ADMIN" }, select: { email: true }, take: 1 } } },
    },
  });
  for (const assinatura of assinaturas) {
    const emailAdmin = assinatura.empresa.usuarios[0]?.email;
    if (!emailAdmin) continue;
    try {
      await enviarEmail({
        destinatario: emailAdmin,
        assunto: "Pagamento em atraso — KAV DECK",
        texto:
          `O pagamento da assinatura da ${assinatura.empresa.razaoSocial} está em atraso. ` +
          `Regularize em até ${DIAS_CARENCIA} dias corridos para evitar a suspensão do acesso ao sistema.`,
      });
      await prisma.assinaturaEmpresa.update({ where: { id: assinatura.id }, data: { avisoAtrasoEnviadoEm: new Date() } });
    } catch (err) {
      // SMTP_NAO_CONFIGURADO é esperado até o cliente definir as variáveis
      // SMTP_* no ambiente — loga e segue sem travar o resto do ciclo.
      console.error("Não foi possível enviar aviso de atraso:", assinatura.empresaId, err.message);
    }
  }
}

export async function rodarCicloAssinaturas() {
  await gerarFaturasRecorrentes();
  await marcarFaturasVencidas();
  await avisarAtrasados();
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
