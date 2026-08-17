import { prisma } from "../../../lib/prisma.js";

const SELECT = {
  id: true,
  ambiente: true,
  serieNfePadrao: true,
  serieNfcePadrao: true,
  cscId: true,
  cscToken: true,
  atualizadoEm: true,
};

// Config única por empresa — devolve os valores padrão (HOMOLOGACAO) se
// ninguém nunca salvou nada, em vez de 404: é mais natural pra tela de
// configuração sempre ter algo pra mostrar.
export async function obter({ empresaId }) {
  const configuracao = await prisma.configuracaoFiscal.findUnique({ where: { empresaId }, select: SELECT });
  if (configuracao) return configuracao;
  return { id: null, ambiente: "HOMOLOGACAO", serieNfePadrao: "1", serieNfcePadrao: "1", cscId: null, cscToken: null, atualizadoEm: null };
}

export async function salvar({ empresaId, ambiente, serieNfePadrao, serieNfcePadrao, cscId, cscToken }) {
  return prisma.configuracaoFiscal.upsert({
    where: { empresaId },
    update: { ambiente, serieNfePadrao, serieNfcePadrao, cscId, cscToken },
    create: { empresaId, ambiente, serieNfePadrao, serieNfcePadrao, cscId, cscToken },
    select: SELECT,
  });
}
