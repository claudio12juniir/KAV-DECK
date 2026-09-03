import { Navigate, Route, Routes } from "react-router-dom";
import { CategoriasPage } from "../features/cadastros/categorias/CategoriasPage.jsx";
import { CondicoesPagamentoPage } from "../features/cadastros/condicoesPagamento/CondicoesPagamentoPage.jsx";
import { DepartamentosPage } from "../features/cadastros/departamentos/DepartamentosPage.jsx";
import { ProdutosPage } from "../features/cadastros/produtos/ProdutosPage.jsx";
import { TabelaPrecoItensPage } from "../features/cadastros/tabelasPreco/TabelaPrecoItensPage.jsx";
import { TabelasPrecoPage } from "../features/cadastros/tabelasPreco/TabelasPrecoPage.jsx";
import { UnidadesMedidaPage } from "../features/cadastros/unidadesMedida/UnidadesMedidaPage.jsx";
import { IcmsPage } from "../features/cadastros/regrasFiscais/IcmsPage.jsx";
import { IpiPage } from "../features/cadastros/regrasFiscais/IpiPage.jsx";
import { PisPage } from "../features/cadastros/regrasFiscais/PisPage.jsx";
import { CofinsPage } from "../features/cadastros/regrasFiscais/CofinsPage.jsx";
import { IbsPage } from "../features/cadastros/regrasFiscais/IbsPage.jsx";
import { CbsPage } from "../features/cadastros/regrasFiscais/CbsPage.jsx";
import { NovoPedidoCompraPage } from "../features/compras/NovoPedidoCompraPage.jsx";
import { PedidoCompraDetailPage } from "../features/compras/PedidoCompraDetailPage.jsx";
import { PedidosCompraListPage } from "../features/compras/PedidosCompraListPage.jsx";
import { RecebimentoPedidoCompraPage } from "../features/compras/RecebimentoPedidoCompraPage.jsx";
import { DashboardPage } from "../features/dashboard/DashboardPage.jsx";
import { CaixasEmbalagemPage } from "../features/estoque/caixasEmbalagem/CaixasEmbalagemPage.jsx";
import { InventarioDetailPage } from "../features/estoque/inventarios/InventarioDetailPage.jsx";
import { InventariosPage } from "../features/estoque/inventarios/InventariosPage.jsx";
import { NovoInventarioPage } from "../features/estoque/inventarios/NovoInventarioPage.jsx";
import { LotesPage } from "../features/estoque/LotesPage.jsx";
import { EstoqueFaturadoPage } from "../features/estoque/estoqueFaturado/EstoqueFaturadoPage.jsx";
import { MovimentosPage } from "../features/estoque/movimentos/MovimentosPage.jsx";
import { PreviaEstoquePage } from "../features/estoque/previaEstoque/PreviaEstoquePage.jsx";
import { RastreabilidadePage } from "../features/estoque/rastreabilidade/RastreabilidadePage.jsx";
import { RecebimentoPage } from "../features/estoque/recebimento/RecebimentoPage.jsx";
import { CaixaPage } from "../features/financeiro/caixa/CaixaPage.jsx";
import { CentrosCustoPage } from "../features/financeiro/centrosCusto/CentrosCustoPage.jsx";
import { ChequesEmitidosPage } from "../features/financeiro/chequesEmitidos/ChequesEmitidosPage.jsx";
import { ChequesTerceirosPage } from "../features/financeiro/chequesTerceiros/ChequesTerceirosPage.jsx";
import { ContasBancariasPage } from "../features/financeiro/contasBancarias/ContasBancariasPage.jsx";
import { PlanoContasPage } from "../features/financeiro/planoContas/PlanoContasPage.jsx";
import { TituloDetailPage } from "../features/financeiro/titulos/TituloDetailPage.jsx";
import { TitulosPage } from "../features/financeiro/titulos/TitulosPage.jsx";
import { CertificadosDigitaisPage } from "../features/fiscal/certificadosDigitais/CertificadosDigitaisPage.jsx";
import { CfopPage } from "../features/fiscal/cfop/CfopPage.jsx";
import { NaturezasOperacaoPage } from "../features/fiscal/naturezasOperacao/NaturezasOperacaoPage.jsx";
import { NotaFiscalDetailPage } from "../features/fiscal/notasFiscais/NotaFiscalDetailPage.jsx";
import { NotasFiscaisPage } from "../features/fiscal/notasFiscais/NotasFiscaisPage.jsx";
import { NovaNotaFiscalPage } from "../features/fiscal/notasFiscais/NovaNotaFiscalPage.jsx";
import { TributacaoProdutoPage } from "../features/fiscal/tributacaoProduto/TributacaoProdutoPage.jsx";
import { ClientesPage } from "../features/participantes/clientes/ClientesPage.jsx";
import { ColaboradoresPage } from "../features/participantes/colaboradores/ColaboradoresPage.jsx";
import { GruposEmpresasPage } from "../features/participantes/gruposEmpresas/GruposEmpresasPage.jsx";
import { ParticipantesPage } from "../features/participantes/participantes/ParticipantesPage.jsx";
import { RotasEntregaPage } from "../features/participantes/rotasEntrega/RotasEntregaPage.jsx";
import { TransportadorasPage } from "../features/participantes/transportadoras/TransportadorasPage.jsx";
import { RelatoriosPage } from "../features/gerenciais/relatorios/RelatoriosPage.jsx";
import { AssinaturaPage } from "../features/sistema/assinatura/AssinaturaPage.jsx";
import { ControleAcessoPage } from "../features/sistema/controleAcesso/ControleAcessoPage.jsx";
import { DevolucoesPage } from "../features/vendas/devolucoes/DevolucoesPage.jsx";
import { FaturarPedidoVendaPage } from "../features/vendas/FaturarPedidoVendaPage.jsx";
import { ItinerarioPage } from "../features/vendas/itinerario/ItinerarioPage.jsx";
import { NovoPedidoVendaPage } from "../features/vendas/NovoPedidoVendaPage.jsx";
import { OcorrenciasPage } from "../features/vendas/ocorrencias/OcorrenciasPage.jsx";
import { PedidoVendaDetailPage } from "../features/vendas/PedidoVendaDetailPage.jsx";
import { PedidosVendaListPage } from "../features/vendas/PedidosVendaListPage.jsx";

// Toda a área autenticada, montada dentro do <MemoryRouter> próprio de cada
// aba (ver AppShell.jsx) — por isso não tem rota de login/entrada/criar-conta
// aqui, essas ficam só no router real (App.jsx). useNavigate/<Link> usados
// dentro de qualquer uma dessas páginas navegam só na aba onde estão
// montados, nunca na URL real do navegador nem nas outras abas.
export function WorkspaceRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/vendas" element={<PedidosVendaListPage />} />
      <Route path="/vendas/novo" element={<NovoPedidoVendaPage />} />
      <Route path="/vendas/:id" element={<PedidoVendaDetailPage />} />
      <Route path="/vendas/:id/faturar" element={<FaturarPedidoVendaPage />} />
      <Route path="/vendas/devolucoes" element={<DevolucoesPage />} />
      <Route path="/vendas/ocorrencias" element={<OcorrenciasPage />} />
      <Route path="/vendas/itinerario" element={<ItinerarioPage />} />
      <Route path="/compras" element={<PedidosCompraListPage />} />
      <Route path="/compras/novo" element={<NovoPedidoCompraPage />} />
      <Route path="/compras/:id" element={<PedidoCompraDetailPage />} />
      <Route path="/compras/:id/recebimento" element={<RecebimentoPedidoCompraPage />} />
      <Route path="/estoque" element={<LotesPage />} />
      <Route path="/estoque/inventarios" element={<InventariosPage />} />
      <Route path="/estoque/inventarios/novo" element={<NovoInventarioPage />} />
      <Route path="/estoque/inventarios/:id" element={<InventarioDetailPage />} />
      <Route path="/estoque/caixas-embalagem" element={<CaixasEmbalagemPage />} />
      <Route path="/estoque/faturado" element={<EstoqueFaturadoPage />} />
      <Route path="/estoque/previa" element={<PreviaEstoquePage />} />
      <Route path="/estoque/movimentos" element={<MovimentosPage />} />
      <Route path="/estoque/rastreabilidade" element={<RastreabilidadePage />} />
      <Route path="/estoque/recebimento" element={<RecebimentoPage />} />

      <Route path="/cadastros/departamentos" element={<DepartamentosPage />} />
      <Route path="/cadastros/categorias" element={<CategoriasPage />} />
      <Route path="/cadastros/unidades-medida" element={<UnidadesMedidaPage />} />
      <Route path="/cadastros/condicoes-pagamento" element={<CondicoesPagamentoPage />} />
      <Route path="/cadastros/produtos" element={<ProdutosPage />} />
      <Route path="/cadastros/tabelas-preco" element={<TabelasPrecoPage />} />
      <Route path="/cadastros/tabelas-preco/:id/itens" element={<TabelaPrecoItensPage />} />
      <Route path="/cadastros/regras-icms" element={<IcmsPage />} />
      <Route path="/cadastros/regras-ipi" element={<IpiPage />} />
      <Route path="/cadastros/regras-pis" element={<PisPage />} />
      <Route path="/cadastros/regras-cofins" element={<CofinsPage />} />
      <Route path="/cadastros/regras-ibs" element={<IbsPage />} />
      <Route path="/cadastros/regras-cbs" element={<CbsPage />} />

      <Route path="/participantes" element={<ParticipantesPage />} />
      <Route path="/participantes/clientes" element={<ClientesPage />} />
      <Route path="/participantes/grupos-empresas" element={<GruposEmpresasPage />} />
      <Route path="/participantes/transportadoras" element={<TransportadorasPage />} />
      <Route path="/participantes/rotas-entrega" element={<RotasEntregaPage />} />
      <Route path="/participantes/colaboradores" element={<ColaboradoresPage />} />

      <Route path="/financeiro/titulos" element={<TitulosPage />} />
      <Route path="/financeiro/titulos/pagar" element={<TitulosPage tipoFixo="PAGAR" titulo="Contas a pagar" />} />
      <Route
        path="/financeiro/titulos/receber"
        element={<TitulosPage tipoFixo="RECEBER" titulo="Contas a receber" />}
      />
      <Route path="/financeiro/titulos/:id" element={<TituloDetailPage />} />
      <Route path="/financeiro/caixa" element={<CaixaPage />} />
      <Route path="/financeiro/contas-bancarias" element={<ContasBancariasPage />} />
      <Route path="/financeiro/plano-contas" element={<PlanoContasPage />} />
      <Route path="/financeiro/centros-custo" element={<CentrosCustoPage />} />
      <Route path="/financeiro/cheques-emitidos" element={<ChequesEmitidosPage />} />
      <Route path="/financeiro/cheques-terceiros" element={<ChequesTerceirosPage />} />

      <Route path="/fiscal/notas" element={<NotasFiscaisPage />} />
      <Route path="/fiscal/notas/nova" element={<NovaNotaFiscalPage />} />
      <Route path="/fiscal/notas/:id" element={<NotaFiscalDetailPage />} />
      <Route path="/fiscal/naturezas-operacao" element={<NaturezasOperacaoPage />} />
      <Route path="/fiscal/certificados-digitais" element={<CertificadosDigitaisPage />} />
      <Route path="/fiscal/cfop" element={<CfopPage />} />
      <Route path="/fiscal/tributacao-produto" element={<TributacaoProdutoPage />} />

      <Route path="/relatorios" element={<RelatoriosPage />} />
      <Route path="/sistema/controle-acesso" element={<ControleAcessoPage />} />
      <Route path="/sistema/assinatura" element={<AssinaturaPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
