import { prisma } from "../../../lib/prisma.js";

const SELECT = {
  id: true,
  razaoSocial: true,
  cnpj: true,
  telefone: true,
  emailServico: true,
  logotipoDataUrl: true,
  atualizadoEm: true,
};

export async function obter({ empresaId }) {
  return prisma.empresa.findUniqueOrThrow({ where: { id: empresaId }, select: SELECT });
}

export async function atualizar({ empresaId, data }) {
  return prisma.empresa.update({ where: { id: empresaId }, data, select: SELECT });
}
