import { Router } from "express";

import { router as meRouter } from "../modules/auth/me/routes.js";

import { router as departamentosRouter } from "../modules/cadastros/departamentos/routes.js";
import { router as categoriasRouter } from "../modules/cadastros/categorias/routes.js";
import { router as unidadesMedidaRouter } from "../modules/cadastros/unidadesMedida/routes.js";
import { router as produtosRouter } from "../modules/cadastros/produtos/routes.js";
import { router as condicoesPagamentoRouter } from "../modules/cadastros/condicoesPagamento/routes.js";
import { router as tabelasPrecoRouter } from "../modules/cadastros/tabelasPreco/routes.js";

import { router as participantesRouter } from "../modules/participantes/participantes/routes.js";
import { router as clientesRouter } from "../modules/participantes/clientes/routes.js";
import { router as fornecedoresRouter } from "../modules/participantes/fornecedores/routes.js";
import { router as gruposEmpresasRouter } from "../modules/participantes/gruposEmpresas/routes.js";
import { router as transportadorasRouter } from "../modules/participantes/transportadoras/routes.js";
import { router as rotasEntregaRouter } from "../modules/participantes/rotasEntrega/routes.js";
import { router as colaboradoresRouter } from "../modules/participantes/colaboradores/routes.js";

import { router as pedidosCompraRouter } from "../modules/compras/pedidosCompra/routes.js";
import { router as precosCompraRouter } from "../modules/compras/precosCompra/routes.js";
import { router as freteDescargaRouter } from "../modules/compras/freteDescarga/routes.js";
import { router as faturaProdutorRouter } from "../modules/compras/faturaProdutor/routes.js";
import { router as pedidosVendaRouter } from "../modules/vendas/pedidosVenda/routes.js";
import { router as devolucoesVendaRouter } from "../modules/vendas/devolucoesVenda/routes.js";
import { router as ocorrenciasRouter } from "../modules/vendas/ocorrencias/routes.js";

import { router as lotesRouter } from "../modules/estoque/lotes/routes.js";
import { router as movimentosEstoqueRouter } from "../modules/estoque/movimentos/routes.js";
import { router as inventariosFisicosRouter } from "../modules/estoque/inventariosFisicos/routes.js";
import { router as caixasEmbalagemRouter } from "../modules/estoque/caixasEmbalagem/routes.js";
import { router as recebimentoRouter } from "../modules/estoque/recebimento/routes.js";
import { router as previaEstoqueRouter } from "../modules/estoque/previaEstoque/routes.js";
import { router as estoqueFaturadoRouter } from "../modules/estoque/estoqueFaturado/routes.js";
import { router as rastreabilidadeRouter } from "../modules/estoque/rastreabilidade/routes.js";

import { router as titulosRouter } from "../modules/financeiro/titulos/routes.js";
import { router as fluxoCaixaRouter } from "../modules/financeiro/fluxoCaixa/routes.js";
import { router as contasBancariasRouter } from "../modules/financeiro/contasBancarias/routes.js";
import { router as planoContasRouter } from "../modules/financeiro/planoContas/routes.js";
import { router as centrosCustoRouter } from "../modules/financeiro/centrosCusto/routes.js";
import { router as caixaRouter } from "../modules/financeiro/caixa/routes.js";
import { router as chequesEmitidosRouter } from "../modules/financeiro/chequesEmitidos/routes.js";
import { router as chequesTerceirosRouter } from "../modules/financeiro/chequesTerceiros/routes.js";

import { router as cfopRouter } from "../modules/fiscal/cfop/routes.js";
import { router as naturezasOperacaoRouter } from "../modules/fiscal/naturezasOperacao/routes.js";
import { router as certificadosDigitaisRouter } from "../modules/fiscal/certificadosDigitais/routes.js";
import { router as notasFiscaisRouter } from "../modules/fiscal/notasFiscais/routes.js";
import { router as utilitariosFiscaisRouter } from "../modules/fiscal/utilitarios/routes.js";
import { router as configuracoesFiscaisRouter } from "../modules/fiscal/configuracoes/routes.js";

import { router as controleAcessoRouter } from "../modules/sistema/controleAcesso/routes.js";
import { router as minhaEmpresaRouter } from "../modules/sistema/minhaEmpresa/routes.js";
import { router as sessoesRouter } from "../modules/sistema/sessoes/routes.js";

import { router as regrasIcmsRouter } from "../modules/cadastros/regrasFiscais/icms.js";
import { router as regrasIpiRouter } from "../modules/cadastros/regrasFiscais/ipi.js";
import { router as regrasPisRouter } from "../modules/cadastros/regrasFiscais/pis.js";
import { router as regrasCofinsRouter } from "../modules/cadastros/regrasFiscais/cofins.js";
import { router as regrasIbsRouter } from "../modules/cadastros/regrasFiscais/ibs.js";
import { router as regrasCbsRouter } from "../modules/cadastros/regrasFiscais/cbs.js";

import { router as dashboardGerencialRouter } from "../modules/gerenciais/dashboard/routes.js";
import { router as analyticsRouter } from "../modules/gerenciais/analytics/routes.js";
import { router as relatoriosGerenciaisRouter } from "../modules/gerenciais/relatorios/routes.js";

import { router as itinerarioRouter } from "../modules/vendas/itinerario/routes.js";

export const router = Router();

router.use("/me", meRouter);

router.use("/cadastros/departamentos", departamentosRouter);
router.use("/cadastros/categorias", categoriasRouter);
router.use("/cadastros/unidades-medida", unidadesMedidaRouter);
router.use("/cadastros/produtos", produtosRouter);
router.use("/cadastros/condicoes-pagamento", condicoesPagamentoRouter);
router.use("/cadastros/tabelas-preco", tabelasPrecoRouter);
router.use("/cadastros/regras-icms", regrasIcmsRouter);
router.use("/cadastros/regras-ipi", regrasIpiRouter);
router.use("/cadastros/regras-pis", regrasPisRouter);
router.use("/cadastros/regras-cofins", regrasCofinsRouter);
router.use("/cadastros/regras-ibs", regrasIbsRouter);
router.use("/cadastros/regras-cbs", regrasCbsRouter);

router.use("/participantes/clientes", clientesRouter);
router.use("/participantes/fornecedores", fornecedoresRouter);
router.use("/participantes/grupos-empresas", gruposEmpresasRouter);
router.use("/participantes/transportadoras", transportadorasRouter);
router.use("/participantes/rotas-entrega", rotasEntregaRouter);
router.use("/participantes/colaboradores", colaboradoresRouter);
router.use("/participantes", participantesRouter);

router.use("/compras/pedidos", pedidosCompraRouter);
router.use("/compras/precos", precosCompraRouter);
router.use("/compras/frete-descarga", freteDescargaRouter);
router.use("/compras/fatura-produtor", faturaProdutorRouter);
router.use("/vendas/pedidos", pedidosVendaRouter);
router.use("/vendas/devolucoes", devolucoesVendaRouter);
router.use("/vendas/ocorrencias", ocorrenciasRouter);
router.use("/vendas/itinerario", itinerarioRouter);

router.use("/estoque/lotes", lotesRouter);
router.use("/estoque/movimentos", movimentosEstoqueRouter);
router.use("/estoque/inventarios", inventariosFisicosRouter);
router.use("/estoque/caixas-embalagem", caixasEmbalagemRouter);
router.use("/estoque/recebimento", recebimentoRouter);
router.use("/estoque/previa", previaEstoqueRouter);
router.use("/estoque/faturado", estoqueFaturadoRouter);
router.use("/estoque/rastreabilidade", rastreabilidadeRouter);

router.use("/financeiro/titulos", titulosRouter);
router.use("/financeiro/fluxo-caixa", fluxoCaixaRouter);
router.use("/financeiro/contas-bancarias", contasBancariasRouter);
router.use("/financeiro/plano-contas", planoContasRouter);
router.use("/financeiro/centros-custo", centrosCustoRouter);
router.use("/financeiro/caixa/movimentos", caixaRouter);
router.use("/financeiro/cheques-emitidos", chequesEmitidosRouter);
router.use("/financeiro/cheques-terceiros", chequesTerceirosRouter);

router.use("/fiscal/cfop", cfopRouter);
router.use("/fiscal/naturezas-operacao", naturezasOperacaoRouter);
router.use("/fiscal/certificados-digitais", certificadosDigitaisRouter);
router.use("/fiscal/notas", notasFiscaisRouter);
router.use("/fiscal/utilitarios", utilitariosFiscaisRouter);
router.use("/fiscal/configuracoes", configuracoesFiscaisRouter);

router.use("/sistema/controle-acesso", controleAcessoRouter);
router.use("/sistema/minha-empresa", minhaEmpresaRouter);
router.use("/sistema/sessoes", sessoesRouter);

router.use("/gerenciais/dashboard", dashboardGerencialRouter);
router.use("/gerenciais/analytics", analyticsRouter);
router.use("/gerenciais/relatorios", relatoriosGerenciaisRouter);
