import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import {
  atualizarCartaoPreapproval,
  atualizarValorPreapproval,
  cancelarPreapproval,
  criarPagamentoBoleto,
  criarPagamentoPix,
  criarPreapproval,
} from "../../../lib/mercadoPago.js";
import { AppError } from "../../../utils/AppError.js";

export const VALOR_PONTO_EXTRA = new Prisma.Decimal("5.00");

const PONTOS_UTILIZAVEIS = { in: ["ATIVO", "CANCELAMENTO_AGENDADO"] };

function addDias(data, dias) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

async function getAssinaturaOrThrow(empresaId) {
  const assinatura = await prisma.assinaturaEmpresa.findUnique({ where: { empresaId } });
  if (!assinatura) throw new AppError(404, "NOT_FOUND", "Assinatura não encontrada para esta empresa.");
  return assinatura;
}

async function getAdminOrThrow(empresaId) {
  const admin = await prisma.usuario.findFirst({ where: { empresaId, role: "ADMIN" }, orderBy: { criadoEm: "asc" } });
  if (!admin) throw new AppError(404, "NOT_FOUND", "Nenhum administrador encontrado para esta empresa.");
  return admin;
}

// Soma só os pontos ATIVO (não os em CANCELAMENTO_AGENDADO) porque é
// exatamente esse o valor que a PRÓXIMA cobrança (cartão automático, ou
// próxima fatura de pix/boleto) vai usar — um ponto cancelado já teve seu
// valor removido no momento do cancelamento, mesmo continuando utilizável
// até o fim do ciclo.
async function valorAtivoAtual(empresaId) {
  const resultado = await prisma.pontoAcesso.aggregate({
    where: { empresaId, status: "ATIVO" },
    _sum: { valorMensal: true },
  });
  return resultado._sum.valorMensal ?? new Prisma.Decimal(0);
}

function supabaseAdminConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new AppError(
      501,
      "SUPABASE_ADMIN_NAO_CONFIGURADO",
      "A criação de acessos internos exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.",
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function criarUsuarioAuth({ email, senha, nome }) {
  const { url, key } = supabaseAdminConfig();
  const resposta = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ email, password: senha, email_confirm: true, user_metadata: { nome } }),
  });
  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagem = payload.msg ?? payload.message ?? "Supabase recusou a criação do usuário.";
    throw new AppError(resposta.status === 422 ? 409 : 502, "SUPABASE_ADMIN_API_ERRO", mensagem);
  }
  return payload;
}

async function excluirUsuarioAuth(usuarioId) {
  const { url, key } = supabaseAdminConfig();
  await fetch(`${url}/auth/v1/admin/users/${usuarioId}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch(() => null);
}

function diasEmAtraso(dataVencimentoAtual) {
  if (!dataVencimentoAtual) return 0;
  const diffMs = Date.now() - new Date(dataVencimentoAtual).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export async function obterDashboard({ empresaId }) {
  // Diferente das outras operações deste módulo (comprar/cancelar ponto,
  // que exigem uma assinatura de verdade pra fazer sentido), o dashboard
  // não pode simplesmente dar 404 — empresas criadas antes do sistema de
  // assinaturas existir (ex.: o seed local) não têm AssinaturaEmpresa
  // nenhuma, e a tela precisa mostrar um estado vazio explicável em vez de
  // um erro vermelho.
  const assinatura = await prisma.assinaturaEmpresa.findUnique({ where: { empresaId } });
  if (!assinatura) {
    return {
      semAssinatura: true,
      status: null,
      proximaCobranca: null,
      diasEmAtraso: 0,
      pontosContratados: 0,
      conectadosAgora: 0,
      valorProximaCobranca: new Prisma.Decimal(0),
      pontos: [],
    };
  }

  const pontos = await prisma.pontoAcesso.findMany({
    where: { empresaId, status: PONTOS_UTILIZAVEIS },
    orderBy: { criadoEm: "asc" },
    select: {
      id: true,
      tipo: true,
      valorMensal: true,
      status: true,
      dataFimVigencia: true,
      criadoEm: true,
      usuario: { select: { id: true, nome: true, email: true, role: true, ativo: true } },
    },
  });

  const conectadosAgora = await prisma.sessaoAtiva.count({ where: { usuario: { empresaId } } });

  const valorProximaCobranca = pontos
    .filter((p) => p.status === "ATIVO")
    .reduce((soma, p) => soma.plus(p.valorMensal), new Prisma.Decimal(0));

  return {
    semAssinatura: false,
    status: assinatura.status,
    formaPagamento: assinatura.formaPagamento,
    proximaCobranca: assinatura.proximaCobranca,
    diasEmAtraso: diasEmAtraso(assinatura.dataVencimentoAtual),
    pontosContratados: pontos.length,
    conectadosAgora,
    valorProximaCobranca,
    pontos,
    cpfResponsavel: assinatura.cpfResponsavel,
    enderecoResponsavel: assinatura.enderecoResponsavel,
    fatura:
      assinatura.formaPagamento === "CARTAO" || !assinatura.faturaMpPaymentId
        ? null
        : {
            vencimento: assinatura.faturaVencimento,
            pixCopiaCola: assinatura.faturaPixCopiaCola,
            pixQrCodeBase64: assinatura.faturaPixQrCodeBase64,
            boletoUrl: assinatura.faturaBoletoUrl,
            boletoLinha: assinatura.faturaBoletoLinha,
          },
  };
}

// A chamada ao Mercado Pago acontece ANTES de gravar no banco, de propósito:
// evita segurar uma transação Prisma aberta durante uma chamada HTTP externa
// (risco de exaurir o pool de conexões / estourar timeout da transação). Se a
// chamada ao MP falhar, nada foi escrito ainda — não sobra estado parcial.
export async function comprarAcesso({ empresaId, nome, email, senha, role }) {
  const assinatura = await getAssinaturaOrThrow(empresaId);
  if (assinatura.status !== "ATIVA") {
    throw new AppError(409, "ASSINATURA_NAO_ATIVA", "Só é possível criar acessos com a assinatura em dia.");
  }

  const emailNormalizado = email.trim().toLowerCase();
  const usuarioExistente = await prisma.usuario.findUnique({ where: { email: emailNormalizado }, select: { id: true } });
  if (usuarioExistente) throw new AppError(409, "EMAIL_EM_USO", "Este e-mail já está vinculado a um usuário.");

  const totalAnterior = await valorAtivoAtual(empresaId);
  const novoTotal = totalAnterior.plus(VALOR_PONTO_EXTRA);
  // Pix/boleto não têm cobrança automática pra atualizar — o valor novo só
  // entra na PRÓXIMA fatura gerada (valorAtivoAtual já reflete isso).
  if (assinatura.formaPagamento === "CARTAO" && assinatura.mpPreapprovalId) {
    await atualizarValorPreapproval(assinatura.mpPreapprovalId, novoTotal);
  }

  let usuarioAuth;
  try {
    usuarioAuth = await criarUsuarioAuth({ email: emailNormalizado, senha, nome });
    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: { id: usuarioAuth.id, empresaId, nome, email: emailNormalizado, role, ativo: true },
      });
      await tx.pontoAcesso.create({
        data: {
          empresaId,
          usuarioId: usuario.id,
          tipo: "EXTRA",
          valorMensal: VALOR_PONTO_EXTRA,
          status: "ATIVO",
        },
      });
    });
  } catch (erro) {
    if (usuarioAuth?.id) await excluirUsuarioAuth(usuarioAuth.id);
    if (assinatura.formaPagamento === "CARTAO" && assinatura.mpPreapprovalId) {
      await atualizarValorPreapproval(assinatura.mpPreapprovalId, totalAnterior).catch(() => null);
    }
    throw erro;
  }

  return obterDashboard({ empresaId });
}

export async function cancelarPonto({ empresaId, pontoId }) {
  const assinatura = await getAssinaturaOrThrow(empresaId);

  const ponto = await prisma.pontoAcesso.findFirst({ where: { id: pontoId, empresaId } });
  if (!ponto) throw new AppError(404, "NOT_FOUND", "Ponto de acesso não encontrado.");
  if (ponto.tipo !== "EXTRA") {
    throw new AppError(409, "PONTO_PRINCIPAL", "O acesso do administrador principal não pode ser cancelado.");
  }
  if (ponto.status !== "ATIVO") {
    throw new AppError(409, "PONTO_NAO_CANCELAVEL", "Este acesso já está cancelado ou encerrado.");
  }

  const novoTotal = (await valorAtivoAtual(empresaId)).minus(ponto.valorMensal);
  if (assinatura.formaPagamento === "CARTAO" && assinatura.mpPreapprovalId) {
    await atualizarValorPreapproval(assinatura.mpPreapprovalId, novoTotal);
  }

  await prisma.pontoAcesso.update({
    where: { id: pontoId },
    data: { status: "CANCELAMENTO_AGENDADO", dataFimVigencia: assinatura.proximaCobranca },
  });

  return obterDashboard({ empresaId });
}

// Sem UI ligada ainda — e usa a mesma via de card_token_id direto que se
// confirmou indisponível nesta conta/sandbox ao testar o cadastro (ver
// comentário em lib/mercadoPago.js). Antes de expor um botão de "trocar
// cartão" no frontend, reconfirmar se esse endpoint funciona ou se precisa
// virar um novo redirecionamento pro checkout do MP, como o de ativação.
export async function trocarCartao({ empresaId, cardTokenId }) {
  const assinatura = await getAssinaturaOrThrow(empresaId);
  if (!assinatura.mpPreapprovalId) {
    throw new AppError(
      409,
      "ASSINATURA_SEM_COBRANCA",
      "Esta empresa ainda não tem uma assinatura ativa no Mercado Pago.",
    );
  }

  await atualizarCartaoPreapproval(assinatura.mpPreapprovalId, cardTokenId);
  return { atualizado: true };
}

// Gera (ou regenera) a fatura avulsa do ciclo vigente pra PIX/BOLETO — nunca
// chamada quando formaPagamento é CARTAO (cobrança automática do MP, sem
// fatura pra mostrar). Usada tanto ao trocar de forma de pagamento quanto
// pelo cron mensal (ver jobs/assinaturasCron.js:gerarFaturasRecorrentes).
export async function gerarFaturaCicloAtual({ empresaId }) {
  const assinatura = await getAssinaturaOrThrow(empresaId);
  if (assinatura.formaPagamento === "CARTAO") return obterDashboard({ empresaId });

  const admin = await getAdminOrThrow(empresaId);
  const valor = await valorAtivoAtual(empresaId);
  const descricao = "Assinatura KAV DECK";
  const externalReference = assinatura.id;

  const pagamento =
    assinatura.formaPagamento === "PIX"
      ? await criarPagamentoPix({ valor, payerEmail: admin.email, externalReference, descricao })
      : await criarPagamentoBoleto({
          valor,
          payerEmail: admin.email,
          cpf: assinatura.cpfResponsavel,
          nome: admin.nome,
          endereco: assinatura.enderecoResponsavel,
          externalReference,
          descricao,
        });

  await prisma.assinaturaEmpresa.update({
    where: { empresaId },
    data: {
      faturaMpPaymentId: String(pagamento.id),
      // 3 dias de prazo pra pagar — depois disso o job de suspensão segue a
      // mesma régua de carência usada pelo cartão (10 dias em INADIMPLENTE
      // contados a partir de dataVencimentoAtual, ver assinaturasCron.js).
      faturaVencimento: addDias(new Date(), 3),
      faturaPixCopiaCola: pagamento.point_of_interaction?.transaction_data?.qr_code ?? null,
      faturaPixQrCodeBase64: pagamento.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      faturaBoletoUrl: pagamento.transaction_details?.external_resource_url ?? null,
      faturaBoletoLinha: pagamento.barcode?.content ?? null,
    },
  });

  return obterDashboard({ empresaId });
}

// Troca a forma de pagamento da assinatura. CARTAO devolve um initPoint pra
// o frontend redirecionar pro checkout hospedado do MP (precisa confirmar um
// cartão novo — nunca herdamos um cartão de uma fatura pix/boleto). PIX e
// BOLETO geram a primeira fatura do novo ciclo na hora, pra a tela já
// mostrar o QR code / linha digitável sem um segundo clique.
export async function trocarFormaPagamento({ empresaId, formaPagamento, cpf, endereco, backUrl }) {
  const assinatura = await getAssinaturaOrThrow(empresaId);
  if (assinatura.status !== "ATIVA" && assinatura.status !== "INADIMPLENTE") {
    throw new AppError(409, "ASSINATURA_NAO_ATIVA", "Só é possível trocar a forma de pagamento com a assinatura em dia ou em atraso.");
  }
  if (formaPagamento === "BOLETO" && (!cpf || !endereco)) {
    throw new AppError(400, "DADOS_INCOMPLETOS", "Boleto exige CPF e endereço completo do responsável pela empresa.");
  }

  // Sai do cartão: cancela a cobrança automática do MP antes de trocar,
  // senão o cartão continuaria sendo cobrado em paralelo com a fatura nova.
  if (assinatura.formaPagamento === "CARTAO" && formaPagamento !== "CARTAO" && assinatura.mpPreapprovalId) {
    await cancelarPreapproval(assinatura.mpPreapprovalId).catch(() => null);
  }

  if (formaPagamento === "CARTAO") {
    const admin = await getAdminOrThrow(empresaId);
    const valor = await valorAtivoAtual(empresaId);
    const preapproval = await criarPreapproval({ payerEmail: admin.email, valorMensal: valor, referenciaExterna: assinatura.id, backUrl });
    await prisma.assinaturaEmpresa.update({
      where: { empresaId },
      data: {
        formaPagamento,
        mpPreapprovalId: String(preapproval.id),
        faturaMpPaymentId: null,
        faturaVencimento: null,
        faturaPixCopiaCola: null,
        faturaPixQrCodeBase64: null,
        faturaBoletoUrl: null,
        faturaBoletoLinha: null,
      },
    });
    return { initPoint: preapproval.init_point };
  }

  await prisma.assinaturaEmpresa.update({
    where: { empresaId },
    data: {
      formaPagamento,
      cpfResponsavel: cpf ?? assinatura.cpfResponsavel,
      enderecoResponsavel: endereco ?? assinatura.enderecoResponsavel,
    },
  });

  return gerarFaturaCicloAtual({ empresaId });
}
