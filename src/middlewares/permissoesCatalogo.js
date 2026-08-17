// Fonte única de verdade das ações protegidas por requirePermissao(). Cada
// entrada documenta o papel padrão (usado quando o usuário não tem override
// em PermissaoUsuario) e alimenta a tela de Controle de Acesso no frontend —
// não é só documentação, o middleware consulta isso em tempo de execução.
export const CATALOGO_PERMISSOES = [
  {
    modulo: "ESTOQUE",
    acao: "AJUSTE_MANUAL",
    label: "Ajustar estoque manualmente",
    descricao: "Lançar um ajuste de saldo (individual ou em lote) fora de um inventário físico formal.",
    papeisPadrao: ["ESTOQUE", "ADMIN"],
  },
  {
    modulo: "COMPRAS",
    acao: "ALTERAR_STATUS_PEDIDO",
    label: "Alterar status do pedido de compra",
    descricao: "Aprovar, estornar ou cancelar um pedido de compra.",
    papeisPadrao: ["COMPRADOR", "ADMIN"],
  },
  {
    modulo: "VENDAS",
    acao: "ALTERAR_STATUS_PEDIDO",
    label: "Alterar status do pedido de venda",
    descricao: "Mover o pedido entre separação, cancelamento e demais status antes do faturamento.",
    papeisPadrao: ["VENDEDOR", "ADMIN", "SEPARADOR"],
  },
  {
    modulo: "FINANCEIRO",
    acao: "CANCELAR_TITULO",
    label: "Cancelar título",
    descricao: "Cancelar um título a pagar ou a receber em aberto.",
    papeisPadrao: ["FINANCEIRO", "ADMIN"],
  },
  {
    modulo: "FINANCEIRO",
    acao: "REVERTER_BAIXA",
    label: "Reverter baixa de título",
    descricao: "Desfazer a baixa mais recente lançada em um título.",
    papeisPadrao: ["FINANCEIRO", "ADMIN"],
  },
  {
    modulo: "FINANCEIRO",
    acao: "PARCELAR_TITULO",
    label: "Parcelar título",
    descricao: "Dividir um título em aberto em títulos filhos, mantendo o valor total.",
    papeisPadrao: ["FINANCEIRO", "ADMIN"],
  },
];

export function buscarPapeisPadrao(modulo, acao) {
  const entrada = CATALOGO_PERMISSOES.find((item) => item.modulo === modulo && item.acao === acao);
  if (!entrada) {
    throw new Error(`Ação de permissão não catalogada: ${modulo}.${acao}. Adicione em permissoesCatalogo.js.`);
  }
  return entrada.papeisPadrao;
}
