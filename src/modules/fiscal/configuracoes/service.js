import { prisma } from "../../../lib/prisma.js";
import * as nfeio from "../../../lib/nfeio.js";

const SELECT = {
  id: true,
  ambiente: true,
  serieNfePadrao: true,
  serieNfcePadrao: true,
  cscId: true,
  cscToken: true,
  nfeioCompanyId: true,
  nfeioStateTaxConfigurado: true,
  inscricaoEstadual: true,
  regimeTributario: true,
  enderecoLogradouro: true,
  enderecoNumero: true,
  enderecoComplemento: true,
  enderecoBairro: true,
  enderecoCep: true,
  enderecoUf: true,
  enderecoCidadeCodigoIbge: true,
  enderecoCidadeNome: true,
  atualizadoEm: true,
};

const PADRAO = {
  id: null,
  ambiente: "HOMOLOGACAO",
  serieNfePadrao: "1",
  serieNfcePadrao: "1",
  cscId: null,
  cscToken: null,
  nfeioCompanyId: null,
  nfeioStateTaxConfigurado: false,
  inscricaoEstadual: null,
  regimeTributario: null,
  enderecoLogradouro: null,
  enderecoNumero: null,
  enderecoComplemento: null,
  enderecoBairro: null,
  enderecoCep: null,
  enderecoUf: null,
  enderecoCidadeCodigoIbge: null,
  enderecoCidadeNome: null,
  atualizadoEm: null,
};

// Config única por empresa — devolve os valores padrão (HOMOLOGACAO) se
// ninguém nunca salvou nada, em vez de 404: é mais natural pra tela de
// configuração sempre ter algo pra mostrar.
export async function obter({ empresaId }) {
  const configuracao = await prisma.configuracaoFiscal.findUnique({ where: { empresaId }, select: SELECT });
  return configuracao ?? PADRAO;
}

function enderecoParaColunas(endereco) {
  if (!endereco) return {};
  return {
    enderecoLogradouro: endereco.logradouro,
    enderecoNumero: endereco.numero,
    enderecoComplemento: endereco.complemento,
    enderecoBairro: endereco.bairro,
    enderecoCep: endereco.cep,
    enderecoUf: endereco.uf,
    enderecoCidadeCodigoIbge: endereco.cidadeCodigoIbge,
    enderecoCidadeNome: endereco.cidadeNome,
  };
}

export async function salvar({
  empresaId,
  ambiente,
  serieNfePadrao,
  serieNfcePadrao,
  cscId,
  cscToken,
  regimeTributario,
  inscricaoEstadual,
  endereco,
}) {
  const dados = {
    ambiente,
    serieNfePadrao,
    serieNfcePadrao,
    cscId,
    cscToken,
    regimeTributario,
    inscricaoEstadual,
    ...enderecoParaColunas(endereco),
  };

  let configuracao = await prisma.configuracaoFiscal.upsert({
    where: { empresaId },
    update: dados,
    create: { empresaId, ...dados },
    select: SELECT,
  });

  // Provisionamento na NFe.io acontece em 2 passos, cada um feito uma única
  // vez por empresa (não há endpoint de update testado pra nenhum dos dois —
  // mudar endereço/regime/IE depois exige contato com o suporte deles ou uma
  // Company nova):
  //  1. Company — precisa de regime tributário + endereço.
  //  2. StateTax — precisa da Company já criada + Inscrição Estadual; sem
  //     isso a emissão de nota falha com "company does not have a state tax
  //     configured" (só descoberto testando contra a API real).
  if (!configuracao.nfeioCompanyId && regimeTributario && endereco) {
    const empresa = await prisma.empresa.findUniqueOrThrow({
      where: { id: empresaId },
      select: { razaoSocial: true, cnpj: true },
    });
    const company = await nfeio.criarCompany({
      razaoSocial: empresa.razaoSocial,
      cnpj: empresa.cnpj,
      regimeTributario,
      endereco,
    });
    configuracao = await prisma.configuracaoFiscal.update({
      where: { empresaId },
      data: { nfeioCompanyId: company.id },
      select: SELECT,
    });
  }

  if (configuracao.nfeioCompanyId && !configuracao.nfeioStateTaxConfigurado && inscricaoEstadual && configuracao.enderecoUf) {
    await nfeio.criarStateTax({
      companyId: configuracao.nfeioCompanyId,
      uf: configuracao.enderecoUf,
      inscricaoEstadual,
      ambiente: configuracao.ambiente,
      serie: configuracao.serieNfePadrao,
    });
    configuracao = await prisma.configuracaoFiscal.update({
      where: { empresaId },
      data: { nfeioStateTaxConfigurado: true },
      select: SELECT,
    });
  }

  return configuracao;
}
