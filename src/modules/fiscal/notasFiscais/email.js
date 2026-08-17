import nodemailer from "nodemailer";
import { AppError } from "../../../utils/AppError.js";

// Sem credenciais reais de SMTP cadastradas neste ambiente — por isso isso
// falha com uma mensagem clara em vez de fingir que enviou. Assim que o
// cliente definir o provedor (SMTP próprio, SendGrid, SES etc.) e as
// variáveis SMTP_* forem preenchidas no .env, passa a funcionar sem
// precisar mudar quem chama essa função.
function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new AppError(
      501,
      "SMTP_NAO_CONFIGURADO",
      "Envio de e-mail ainda não está configurado — defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM no ambiente do servidor.",
    );
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function enviarNotaPorEmail({ destinatario, nota, xml }) {
  const transporte = getTransport();
  const remetente = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporte.sendMail({
    from: remetente,
    to: destinatario,
    subject: `Nota Fiscal ${nota.serie}/${nota.numero}`,
    text: `Segue em anexo o XML da nota fiscal ${nota.serie}/${nota.numero}.`,
    attachments: [{ filename: `${nota.serie}-${nota.numero}.xml`, content: xml }],
  });
}
