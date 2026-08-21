import { prisma } from "../../../lib/prisma.js";
import * as nfeio from "../../../lib/nfeio.js";
import { AppError } from "../../../utils/AppError.js";

const SELECT = { id: true, nome: true, dataVencimento: true };

export async function list({ empresaId, skip, take }) {
  const [items, total] = await Promise.all([
    prisma.certificadoDigital.findMany({
      where: { empresaId },
      select: SELECT,
      skip,
      take,
      orderBy: { dataVencimento: "asc" },
    }),
    prisma.certificadoDigital.count({ where: { empresaId } }),
  ]);
  return { items, total };
}

export async function getById({ empresaId, id }) {
  const certificado = await prisma.certificadoDigital.findFirst({ where: { id, empresaId }, select: SELECT });
  if (!certificado) throw new AppError(404, "NOT_FOUND", "Certificado digital não encontrado.");
  return certificado;
}

export async function create({ empresaId, data }) {
  return prisma.certificadoDigital.create({ data: { ...data, empresaId }, select: SELECT });
}

export async function update({ empresaId, id, data }) {
  await getById({ empresaId, id });
  return prisma.certificadoDigital.update({ where: { id }, data, select: SELECT });
}

export async function remove({ empresaId, id }) {
  await getById({ empresaId, id });
  await prisma.certificadoDigital.delete({ where: { id } });
}

// Repassa o .pfx pra NFe.io (a KAV DECK nunca guarda o arquivo nem a senha)
// e cria o registro local só com os metadados que a NFe.io devolve —
// mantém o padrão já existente do model de não expor conteúdo/senha.
export async function upload({ empresaId, arquivoBuffer, nomeArquivo, senha }) {
  const configuracao = await prisma.configuracaoFiscal.findUnique({
    where: { empresaId },
    select: { nfeioCompanyId: true },
  });
  if (!configuracao?.nfeioCompanyId) {
    throw new AppError(
      422,
      "EMPRESA_SEM_COMPANY_NFEIO",
      "Salve o regime tributário e o endereço em Configurações Fiscais antes de enviar o certificado — é o que cria a empresa na NFe.io.",
    );
  }

  const resultado = await nfeio.uploadCertificado({
    companyId: configuracao.nfeioCompanyId,
    arquivoBuffer,
    nomeArquivo,
    senha,
  });

  // A resposta da NFe.io vem em camelCase (confirmado testando /companies
  // contra a API real — a doc pública mostra PascalCase, desatualizada).
  return prisma.certificadoDigital.create({
    data: {
      empresaId,
      nome: resultado.subject || nomeArquivo,
      dataVencimento: resultado.validUntil ? new Date(resultado.validUntil) : new Date(),
    },
    select: SELECT,
  });
}
