import nodemailer from "nodemailer";
import { AppError } from "../utils/AppError.js";

// Sem credenciais reais de SMTP cadastradas neste ambiente — por isso isso
// falha com uma mensagem clara em vez de fingir que enviou. Assim que o
// cliente definir o provedor (SMTP próprio, SendGrid, SES etc.) e as
// variáveis SMTP_* forem preenchidas no ambiente do servidor, passa a
// funcionar sem precisar mudar quem chama enviarEmail.
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

export async function enviarEmail({ destinatario, assunto, texto, anexos }) {
  const transporte = getTransport();
  const remetente = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporte.sendMail({ from: remetente, to: destinatario, subject: assunto, text: texto, attachments: anexos });
}
