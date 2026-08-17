// Gera uma representação XML da nota nos moldes do layout NF-e — não é o
// XML autorizado pela SEFAZ (esse só existe depois de assinado e
// transmitido, o que este sistema ainda não faz — ver
// fiscal/transmissaoSefaz). Serve pra conferência interna e como rascunho
// pronto pra alimentar a assinatura quando o provedor de transmissão for
// escolhido.
function escapeXml(value) {
  return String(value ?? "").replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

const MODELO_POR_TIPO = { NFE: "55", NFCE: "65", NF_FORMULARIO: "55" };

export function gerarXmlNota(nota) {
  const itensXml = nota.itens
    .map(
      (item, index) => `
    <det nItem="${index + 1}">
      <prod>
        <cProd>${escapeXml(item.produto?.codigo)}</cProd>
        <xProd>${escapeXml(item.produto?.descricao)}</xProd>
        <CFOP>${escapeXml(item.cfop?.codigo ?? "")}</CFOP>
        <qCom>${item.quantidade}</qCom>
        <vUnCom>${item.valorUnitario}</vUnCom>
      </prod>
      <imposto>
        <ICMS>${item.valorIcms}</ICMS>
        <IPI>${item.valorIpi}</IPI>
        <PIS>${item.valorPis}</PIS>
        <COFINS>${item.valorCofins}</COFINS>
      </imposto>
    </det>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe" rascunho="true">
  <infNFe>
    <ide>
      <serie>${escapeXml(nota.serie)}</serie>
      <nNF>${escapeXml(nota.numero)}</nNF>
      <mod>${MODELO_POR_TIPO[nota.modeloDocumento] ?? "55"}</mod>
      <dhEmi>${new Date(nota.dataEmissao).toISOString()}</dhEmi>
      <chNFe>${escapeXml(nota.chaveAcesso ?? "")}</chNFe>
    </ide>
    <dest>
      <xNome>${escapeXml(nota.participante?.razaoSocial)}</xNome>
      <CNPJCPF>${escapeXml(nota.participante?.cpfCnpj)}</CNPJCPF>
    </dest>${itensXml}
  </infNFe>
</NFe>`;
}

export function nomeArquivoXml(nota) {
  return `${nota.serie}-${nota.numero}.xml`.replace(/[^\w.-]/g, "_");
}
