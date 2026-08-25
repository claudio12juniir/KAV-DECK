import { createHmac, randomUUID } from "node:crypto";

const BASE_URL = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
      ...(method === "POST" ? { "X-Idempotency-Key": randomUUID() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || data?.error || `Mercado Pago respondeu ${res.status}`;
    const error = new Error(message);
    error.statusCode = res.status;
    error.mpResponse = data;
    throw error;
  }
  return data;
}

// Assinatura recorrente "sem plano associado". `referenciaExterna` é o id da
// nossa AssinaturaEmpresa, pra casar o webhook de volta com o registro certo
// sem depender só do id do MP.
//
// Testado em 2026-08-20 contra o sandbox real: criar já com `card_token_id` +
// `status: "authorized"` (ativação 100% via API, sem redirecionar o cliente)
// devolve 404 "Card token service not found" — recurso não disponível nesta
// conta/aplicação MP. Sem `card_token_id`, o MP cria a assinatura "pending" e
// devolve um `init_point`: o cliente PRECISA ser redirecionado pra esse
// checkout hospedado do próprio Mercado Pago pra confirmar o cartão — é o
// único caminho confirmado funcionando. Deixei o parâmetro `cardTokenId`
// aqui só pra o dia em que esse recurso for habilitado nesta conta.
export async function criarPreapproval({ payerEmail, valorMensal, referenciaExterna, backUrl, cardTokenId }) {
  const body = {
    reason: "Assinatura KAV DECK",
    external_reference: referenciaExterna,
    payer_email: payerEmail,
    back_url: backUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: Number(valorMensal),
      currency_id: "BRL",
    },
  };
  if (cardTokenId) {
    body.card_token_id = cardTokenId;
    body.status = "authorized";
  }
  return request("POST", "/preapproval", body);
}

// Só muda o valor cobrado a partir do PRÓXIMO ciclo — o MP não cobra
// diferença retroativa do período corrente, o que já é exatamente o
// comportamento decidido pra compra/cancelamento de ponto no meio do ciclo.
export async function atualizarValorPreapproval(preapprovalId, novoValor) {
  return request("PUT", `/preapproval/${preapprovalId}`, {
    auto_recurring: { transaction_amount: Number(novoValor) },
  });
}

export async function atualizarCartaoPreapproval(preapprovalId, cardTokenId) {
  return request("PUT", `/preapproval/${preapprovalId}`, { card_token_id: cardTokenId });
}

export async function buscarPreapproval(preapprovalId) {
  return request("GET", `/preapproval/${preapprovalId}`);
}

// Usado ao trocar de CARTAO pra PIX/BOLETO — sem isso a cobrança automática
// do cartão continuaria rodando em paralelo com a fatura avulsa gerada pra
// nova forma de pagamento.
export async function cancelarPreapproval(preapprovalId) {
  return request("PUT", `/preapproval/${preapprovalId}`, { status: "cancelled" });
}

export async function buscarPagamento(paymentId) {
  return request("GET", `/v1/payments/${paymentId}`);
}

// PIX e boleto não têm produto de assinatura recorrente no Mercado Pago —
// cada ciclo gera um pagamento avulso novo (ver gerarFaturasRecorrentes em
// jobs/assinaturasCron.js) que o cliente paga manualmente antes do
// vencimento. O webhook de "payment" (já usado pelo cartão) trata a
// confirmação da mesma forma, então nenhuma mudança foi necessária lá.
export async function criarPagamentoPix({ valor, payerEmail, externalReference, descricao }) {
  return request("POST", "/v1/payments", {
    transaction_amount: Number(valor),
    description: descricao,
    payment_method_id: "pix",
    external_reference: externalReference,
    payer: { email: payerEmail },
  });
}

// Boleto exige CPF e endereço completo do pagador — sem isso o MP recusa a
// emissão (testado contra a API real em 2026-08-25: "To generate a
// registered boleto the following parameters are required: ...").
export async function criarPagamentoBoleto({ valor, payerEmail, cpf, nome, endereco, externalReference, descricao }) {
  const [firstName, ...rest] = (nome || "Assinante").split(" ");
  return request("POST", "/v1/payments", {
    transaction_amount: Number(valor),
    description: descricao,
    payment_method_id: "bolbradesco",
    external_reference: externalReference,
    payer: {
      email: payerEmail,
      first_name: firstName,
      last_name: rest.join(" ") || firstName,
      identification: { type: "CPF", number: cpf },
      address: {
        zip_code: endereco.cep,
        street_name: endereco.logradouro,
        street_number: endereco.numero,
        neighborhood: endereco.bairro,
        city: endereco.cidade,
        federal_unit: endereco.uf,
      },
    },
  });
}

// Algoritmo oficial do Mercado Pago pra validar a origem do webhook:
// manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};", assinado com
// HMAC-SHA256 usando o secret configurado no painel (Webhooks da aplicação).
// Sem o secret configurado ainda (webhook não registrado em produção), segue
// sem validar — mesma postura já usada no módulo fiscal pro certificado
// digital que ainda não existe: código pronto pra quando a credencial chegar.
export function validarAssinaturaWebhook(req) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET não configurado — webhook aceito sem validar assinatura.");
    return true;
  }

  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];
  const dataId = req.query["data.id"];
  if (!xSignature || !dataId) return false;

  const partes = Object.fromEntries(
    xSignature.split(",").map((parte) => {
      const [chave, valor] = parte.split("=");
      return [chave?.trim(), valor?.trim()];
    }),
  );
  if (!partes.ts || !partes.v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${partes.ts};`;
  const hash = createHmac("sha256", secret).update(manifest).digest("hex");
  return hash === partes.v1;
}
