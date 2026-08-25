import { enviarEmail } from "../../../lib/mailer.js";

export async function enviarNotaPorEmail({ destinatario, nota, xml }) {
  await enviarEmail({
    destinatario,
    assunto: `Nota Fiscal ${nota.serie}/${nota.numero}`,
    texto: `Segue em anexo o XML da nota fiscal ${nota.serie}/${nota.numero}.`,
    anexos: [{ filename: `${nota.serie}-${nota.numero}.xml`, content: xml }],
  });
}
