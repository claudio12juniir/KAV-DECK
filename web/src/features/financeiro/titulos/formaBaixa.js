// Espelha o enum FormaBaixaTitulo do backend (ver prisma/schema.prisma).
export const FORMA_BAIXA_LABEL = {
  BOLETO: "Boleto",
  DEBITO_AUTOMATICO: "Débito automático",
  CARTAO_CREDITO: "Cartão de crédito",
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CHEQUE: "Cheque",
  OUTRO: "Outro",
};

export const FORMAS_BAIXA = Object.keys(FORMA_BAIXA_LABEL);
