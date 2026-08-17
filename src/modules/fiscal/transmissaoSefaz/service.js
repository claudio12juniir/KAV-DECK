import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../utils/AppError.js";

// Ponto único de transmissão à SEFAZ. Hoje o sistema não tem nenhum
// provedor configurado — nem certificado real, nem contrato com um serviço
// tipo Focus NFe/eNotas, nem client SOAP pro webservice direto da SEFAZ.
// Por isso essa função sempre recusa com uma mensagem clara em vez de
// fingir que autoriza a nota. Quando o provedor for escolhido, a
// implementação de fato entra aqui — quem chama (a rota) não muda.
export async function transmitir({ empresaId, notaFiscalId }) {
  const nota = await prisma.notaFiscal.findFirst({
    where: { id: notaFiscalId, empresaId },
    select: { id: true, status: true },
  });
  if (!nota) throw new AppError(404, "NOT_FOUND", "Nota fiscal não encontrada.");
  if (nota.status !== "EM_PROCESSAMENTO") {
    throw new AppError(
      409,
      "NOTA_NAO_TRANSMISSIVEL",
      "A nota precisa estar em processamento (status EM_PROCESSAMENTO) pra ser transmitida.",
    );
  }

  throw new AppError(
    501,
    "SEFAZ_NAO_CONFIGURADO",
    "Transmissão à SEFAZ ainda não está configurada — falta escolher e contratar um provedor (webservice direto ou um serviço como Focus NFe/eNotas) e cadastrar credenciais reais. Até lá, autorizar a nota continua sendo manual via status.",
  );
}
