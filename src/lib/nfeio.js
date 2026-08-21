// Cliente da API da NFe.io. A conta master (KAV DECK) tem uma única API key
// de Nota Fiscal; cada empresa cliente do sistema vira uma "Company"
// separada dentro dessa mesma conta (endpoint /companies), com certificado
// digital e emissão de NF-e isolados por companyId — nunca em cima do CNPJ
// da KAV DECK. Ver ConfiguracaoFiscal.nfeioCompanyId.
//
// Conta atualmente em modo TESTE na NFe.io (falta completar dados de
// faturamento e pedir ativação de produção pelo suporte deles) — notas
// emitidas agora não têm validade fiscal real até essa ativação.
const BASE_URL = "https://api.nfse.io/v2";

function apiKey() {
  const key = process.env.NFEIO_API_KEY;
  if (!key) throw new Error("NFEIO_API_KEY não configurado.");
  return key;
}

async function request(method, path, { body, isMultipart = false } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: apiKey(),
      ...(isMultipart ? {} : { "Content-Type": "application/json" }),
    },
    body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || data?.error?.message || `NFe.io respondeu ${res.status}`;
    const error = new Error(message);
    error.statusCode = res.status;
    error.nfeioResponse = data;
    throw error;
  }
  return data;
}

// Cria a Company dentro da conta master — endereço e regime tributário são
// exigidos pela NFe.io, por isso vêm de ConfiguracaoFiscal (ver schema.js
// deste módulo pro shape esperado de `endereco`).
export async function criarCompany({ razaoSocial, nomeFantasia, cnpj, regimeTributario, endereco }) {
  const data = await request("POST", "/companies", {
    body: {
      Company: {
        Name: razaoSocial,
        TradeName: nomeFantasia || razaoSocial,
        FederalTaxNumber: Number(cnpj),
        TaxRegime: regimeTributario,
        Address: {
          Street: endereco.logradouro,
          Number: endereco.numero,
          AdditionalInformation: endereco.complemento || undefined,
          District: endereco.bairro,
          City: { Code: endereco.cidadeCodigoIbge, Name: endereco.cidadeNome },
          State: endereco.uf,
          PostalCode: endereco.cep,
          Country: "BRA",
        },
      },
    },
  });
  // A API aceita o payload de request em PascalCase (como documentado), mas
  // devolve a resposta em camelCase — confirmado testando contra a API real.
  return data.company;
}

export async function obterCompany({ companyId }) {
  const data = await request("GET", `/companies/${companyId}`);
  return data.company;
}

// Sem isso a emissão falha com 404 "company does not have a state tax
// configured" (descoberto testando contra a API real, não documentado
// claramente) — precisa da Inscrição Estadual da empresa. `serie` aqui é a
// série padrão de NF-e cadastrada em Configurações Fiscais. Path e envelope
// também só foram confirmados testando contra a API real: é
// "/statetaxes" (tudo minúsculo, "stateTaxes" dá 404) e o corpo precisa vir
// dentro de `{ StateTax: {...} }`, senão devolve "StateTax is null".
export async function criarStateTax({ companyId, uf, inscricaoEstadual, ambiente, serie }) {
  return request("POST", `/companies/${companyId}/statetaxes`, {
    body: {
      StateTax: {
        code: uf,
        taxNumber: inscricaoEstadual,
        environmentType: ambiente === "PRODUCAO" ? "Production" : "Test",
        type: "nFe",
        serie,
        number: 1,
      },
    },
  });
}

// Recebe o .pfx (Buffer) já lido do upload multipart do cliente e repassa
// pra NFe.io — a KAV DECK nunca guarda o arquivo nem a senha, só encaminha.
export async function uploadCertificado({ companyId, arquivoBuffer, nomeArquivo, senha }) {
  const form = new FormData();
  form.append("file", new Blob([arquivoBuffer]), nomeArquivo);
  form.append("password", senha);
  return request("POST", `/companies/${companyId}/certificates`, { body: form, isMultipart: true });
}

// Emissão é assíncrona na NFe.io: este POST só devolve o Id do processamento
// (202); o status real (Issued/Rejected + chave de acesso) só chega
// consultando consultarNotaProduto logo depois — ver transmissaoSefaz/service.js.
export async function emitirNotaProduto({ companyId, payload }) {
  return request("POST", `/companies/${companyId}/productinvoices`, { body: payload });
}

export async function consultarNotaProduto({ companyId, invoiceId }) {
  return request("GET", `/companies/${companyId}/productinvoices/${invoiceId}`);
}
