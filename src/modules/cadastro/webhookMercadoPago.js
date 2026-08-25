import { Router } from "express";
import { buscarPagamento, buscarPreapproval, validarAssinaturaWebhook } from "../../lib/mercadoPago.js";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const router = Router();

function addMonths(data, meses) {
  const resultado = new Date(data);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

// A ativação inicial vem sempre por aqui: o cliente confirma o cartão no
// checkout hospedado do MP (init_point, ver modules/cadastro/service.js) e o
// MP notifica esse tipo de evento quando o preapproval muda de status.
async function tratarPreapproval(dataId) {
  const preapproval = await buscarPreapproval(dataId);
  if (!preapproval.external_reference) return;

  const assinatura = await prisma.assinaturaEmpresa.findUnique({ where: { id: preapproval.external_reference } });
  if (!assinatura) return;

  if (preapproval.status === "authorized") {
    await prisma.assinaturaEmpresa.update({
      where: { id: assinatura.id },
      data: {
        status: "ATIVA",
        mpPreapprovalId: String(preapproval.id),
        mpPayerId: preapproval.payer_id ? String(preapproval.payer_id) : null,
        ultimoPagamentoEm: new Date(),
        proximaCobranca: preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : addMonths(new Date(), 1),
        dataVencimentoAtual: null,
      },
    });
  } else if (["cancelled", "paused"].includes(preapproval.status)) {
    await prisma.assinaturaEmpresa.update({
      where: { id: assinatura.id },
      data: { status: "INADIMPLENTE", dataVencimentoAtual: assinatura.dataVencimentoAtual ?? new Date() },
    });
  }
}

// Cobranças recorrentes dos meses seguintes chegam como notificação de
// pagamento avulso vinculado ao preapproval (external_reference herdado).
async function tratarPagamento(dataId) {
  const pagamento = await buscarPagamento(dataId);
  if (!pagamento.external_reference) return;

  const assinatura = await prisma.assinaturaEmpresa.findUnique({ where: { id: pagamento.external_reference } });
  if (!assinatura) return;

  if (pagamento.status === "approved") {
    await prisma.assinaturaEmpresa.update({
      where: { id: assinatura.id },
      data: {
        status: "ATIVA",
        ultimoPagamentoEm: new Date(),
        proximaCobranca: addMonths(new Date(), 1),
        dataVencimentoAtual: null,
        avisoAtrasoEnviadoEm: null,
        // Limpa a fatura do ciclo (só relevante pra pix/boleto — cartão já
        // não usa esses campos) pra o QR code/linha digitável sumirem da
        // tela assim que o cliente pagar.
        faturaMpPaymentId: null,
        faturaVencimento: null,
        faturaPixCopiaCola: null,
        faturaPixQrCodeBase64: null,
        faturaBoletoUrl: null,
        faturaBoletoLinha: null,
      },
    });
  } else if (["rejected", "cancelled"].includes(pagamento.status)) {
    await prisma.assinaturaEmpresa.update({
      where: { id: assinatura.id },
      data: { status: "INADIMPLENTE", dataVencimentoAtual: assinatura.dataVencimentoAtual ?? new Date() },
    });
  }
}

// Rota pública de propósito — o Mercado Pago não manda nosso JWT. A
// segurança vem da validação de assinatura (x-signature/HMAC), não de
// autenticação de sessão. Sempre busca o recurso por ID direto na API do MP
// antes de agir — nunca confia em valores vindos do corpo da notificação.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!validarAssinaturaWebhook(req)) {
      return res.status(401).json({ error: { code: "INVALID_SIGNATURE", message: "Assinatura inválida." } });
    }

    const tipo = req.body?.type ?? req.query.type;
    const dataId = req.body?.data?.id ?? req.query["data.id"];

    if (dataId && tipo === "subscription_preapproval") {
      await tratarPreapproval(dataId);
    } else if (dataId && tipo === "payment") {
      await tratarPagamento(dataId);
    }

    res.status(200).json({ recebido: true });
  }),
);
