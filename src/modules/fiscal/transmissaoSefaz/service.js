import { prisma } from "../../../lib/prisma.js";
import * as nfeio from "../../../lib/nfeio.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT_PARA_TRANSMISSAO = {
  id: true,
  status: true,
  numero: true,
  dataEmissao: true,
  empresaId: true,
  naturezaOperacao: { select: { descricao: true } },
  participante: {
    select: {
      razaoSocial: true,
      cpfCnpj: true,
      tipoPessoa: true,
      enderecos: { select: { logradouro: true, numero: true, bairro: true, cidade: true, uf: true, cep: true }, take: 1 },
    },
  },
  itens: {
    select: {
      quantidade: true,
      valorUnitario: true,
      valorIcms: true,
      produto: { select: { descricao: true, codigo: true, ncm: true, unidadeMedida: { select: { sigla: true } } } },
      cfop: { select: { codigo: true } },
    },
  },
};

// Monta o payload de /productinvoices a partir da nossa NotaFiscal. O
// endereço do destinatário aqui não guarda o código IBGE do município (o
// model Endereco de Participante nunca precisou disso pra mais nada) — a
// NFe.io exige esse código, então até termos uma tabela/consulta de
// município → IBGE, a emissão falha exatamente aqui com uma mensagem clara
// em vez de mandar um código inventado.
function montarPayload(nota) {
  const endereco = nota.participante.enderecos[0];
  if (!endereco) {
    throw new AppError(
      422,
      "PARTICIPANTE_SEM_ENDERECO",
      "O destinatário da nota não tem endereço cadastrado — obrigatório pra NFe.io.",
    );
  }

  return {
    operationType: "Outgoing",
    purposeType: "Normal",
    buyer: {
      name: nota.participante.razaoSocial,
      federalTaxNumber: Number(nota.participante.cpfCnpj),
      type: nota.participante.tipoPessoa === "FISICA" ? "NaturalPerson" : "LegalEntity",
      address: {
        street: endereco.logradouro,
        number: endereco.numero,
        district: endereco.bairro,
        city: { name: endereco.cidade },
        state: endereco.uf,
        postalCode: endereco.cep,
        country: "BRA",
      },
    },
    items: nota.itens.map((item) => {
      const totalAmount = Number(item.quantidade) * Number(item.valorUnitario);
      const valorIcms = Number(item.valorIcms);
      return {
        code: item.produto.codigo,
        description: item.produto.descricao,
        ncm: item.produto.ncm || undefined,
        cfop: Number(item.cfop.codigo),
        quantity: Number(item.quantidade),
        unit: item.produto.unidadeMedida.sigla,
        unitAmount: Number(item.valorUnitario),
        totalAmount,
        // origin/cst fixos em "0"/"00" (nacional, tributação integral) —
        // ItemNotaFiscal hoje só guarda o VALOR do ICMS calculado, não o CST
        // nem a origem da mercadoria (isso vive em RegraIcms, sem vínculo
        // com o item ainda). Simplificação deliberada pra destravar a
        // emissão hoje; item por item com CST/origem reais fica pra depois.
        tax: {
          icms: { origin: "0", cst: "00", baseTax: totalAmount, rate: totalAmount > 0 ? (valorIcms / totalAmount) * 100 : 0, amount: valorIcms },
          pis: { cst: "07" },
          cofins: { cst: "07" },
        },
      };
    }),
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Emissão na NFe.io é assíncrona (202 Accepted); consultamos algumas vezes
// logo em seguida pra já devolver o resultado na mesma resposta em vez de
// deixar a nota presa em EM_PROCESSAMENTO sem nenhum retorno — se ainda não
// saiu depois das tentativas, a nota fica mesmo em processamento e alguém
// precisa consultar de novo depois (não implementado ainda: webhook da
// NFe.io pra atualizar sem polling).
async function aguardarResultado({ companyId, invoiceId }) {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    await delay(2000);
    const resultado = await nfeio.consultarNotaProduto({ companyId, invoiceId });
    if (resultado.status === "Issued" || resultado.status === "Rejected") return resultado;
  }
  return null;
}

export async function transmitir({ empresaId, notaFiscalId }) {
  const nota = await prisma.notaFiscal.findFirst({
    where: { id: notaFiscalId, empresaId },
    select: SELECT_PARA_TRANSMISSAO,
  });
  if (!nota) throw new AppError(404, "NOT_FOUND", "Nota fiscal não encontrada.");
  if (nota.status !== "EM_PROCESSAMENTO") {
    throw new AppError(
      409,
      "NOTA_NAO_TRANSMISSIVEL",
      "A nota precisa estar em processamento (status EM_PROCESSAMENTO) pra ser transmitida.",
    );
  }

  const configuracao = await prisma.configuracaoFiscal.findUnique({
    where: { empresaId },
    select: { nfeioCompanyId: true },
  });
  if (!configuracao?.nfeioCompanyId) {
    throw new AppError(
      501,
      "EMPRESA_SEM_COMPANY_NFEIO",
      "Esta empresa ainda não tem uma Company na NFe.io — salve regime tributário e endereço em Configurações Fiscais primeiro.",
    );
  }

  const payload = montarPayload(nota);
  const emissao = await nfeio.emitirNotaProduto({ companyId: configuracao.nfeioCompanyId, payload });
  const resultado = await aguardarResultado({ companyId: configuracao.nfeioCompanyId, invoiceId: emissao.id });

  if (!resultado) {
    return { status: "EM_PROCESSAMENTO", mensagem: "NFe.io ainda processando — consulte novamente em instantes." };
  }

  if (resultado.status === "Rejected") {
    await prisma.notaFiscal.update({ where: { id: nota.id }, data: { status: "REJEICAO" } });
    return { status: "REJEICAO", motivo: resultado.statusReason || "Rejeitada pela SEFAZ." };
  }

  await prisma.notaFiscal.update({
    where: { id: nota.id },
    data: { status: "AUTORIZADO", chaveAcesso: resultado.accessKey },
  });
  return { status: "AUTORIZADO", chaveAcesso: resultado.accessKey };
}
