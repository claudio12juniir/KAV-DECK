import { useEffect } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell.jsx";
import { ToastProvider, useToast } from "./components/ui/Toast.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { RealtimeProvider } from "./contexts/RealtimeContext.jsx";
import { CategoriasPage } from "./features/cadastros/categorias/CategoriasPage.jsx";
import { CondicoesPagamentoPage } from "./features/cadastros/condicoesPagamento/CondicoesPagamentoPage.jsx";
import { DepartamentosPage } from "./features/cadastros/departamentos/DepartamentosPage.jsx";
import { ProdutosPage } from "./features/cadastros/produtos/ProdutosPage.jsx";
import { TabelaPrecoItensPage } from "./features/cadastros/tabelasPreco/TabelaPrecoItensPage.jsx";
import { TabelasPrecoPage } from "./features/cadastros/tabelasPreco/TabelasPrecoPage.jsx";
import { UnidadesMedidaPage } from "./features/cadastros/unidadesMedida/UnidadesMedidaPage.jsx";
import { NovoPedidoCompraPage } from "./features/compras/NovoPedidoCompraPage.jsx";
import { PedidoCompraDetailPage } from "./features/compras/PedidoCompraDetailPage.jsx";
import { PedidosCompraListPage } from "./features/compras/PedidosCompraListPage.jsx";
import { RecebimentoPedidoCompraPage } from "./features/compras/RecebimentoPedidoCompraPage.jsx";
import { DashboardPage } from "./features/dashboard/DashboardPage.jsx";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { CaixasEmbalagemPage } from "./features/estoque/caixasEmbalagem/CaixasEmbalagemPage.jsx";
import { InventarioDetailPage } from "./features/estoque/inventarios/InventarioDetailPage.jsx";
import { InventariosPage } from "./features/estoque/inventarios/InventariosPage.jsx";
import { NovoInventarioPage } from "./features/estoque/inventarios/NovoInventarioPage.jsx";
import { LotesPage } from "./features/estoque/LotesPage.jsx";
import { CaixaPage } from "./features/financeiro/caixa/CaixaPage.jsx";
import { CentrosCustoPage } from "./features/financeiro/centrosCusto/CentrosCustoPage.jsx";
import { ChequesEmitidosPage } from "./features/financeiro/chequesEmitidos/ChequesEmitidosPage.jsx";
import { ChequesTerceirosPage } from "./features/financeiro/chequesTerceiros/ChequesTerceirosPage.jsx";
import { ContasBancariasPage } from "./features/financeiro/contasBancarias/ContasBancariasPage.jsx";
import { PlanoContasPage } from "./features/financeiro/planoContas/PlanoContasPage.jsx";
import { TituloDetailPage } from "./features/financeiro/titulos/TituloDetailPage.jsx";
import { TitulosPage } from "./features/financeiro/titulos/TitulosPage.jsx";
import { CertificadosDigitaisPage } from "./features/fiscal/certificadosDigitais/CertificadosDigitaisPage.jsx";
import { CfopPage } from "./features/fiscal/cfop/CfopPage.jsx";
import { NaturezasOperacaoPage } from "./features/fiscal/naturezasOperacao/NaturezasOperacaoPage.jsx";
import { NotaFiscalDetailPage } from "./features/fiscal/notasFiscais/NotaFiscalDetailPage.jsx";
import { NotasFiscaisPage } from "./features/fiscal/notasFiscais/NotasFiscaisPage.jsx";
import { NovaNotaFiscalPage } from "./features/fiscal/notasFiscais/NovaNotaFiscalPage.jsx";
import { ClientesPage } from "./features/participantes/clientes/ClientesPage.jsx";
import { ColaboradoresPage } from "./features/participantes/colaboradores/ColaboradoresPage.jsx";
import { GruposEmpresasPage } from "./features/participantes/gruposEmpresas/GruposEmpresasPage.jsx";
import { ParticipantesPage } from "./features/participantes/participantes/ParticipantesPage.jsx";
import { RotasEntregaPage } from "./features/participantes/rotasEntrega/RotasEntregaPage.jsx";
import { TransportadorasPage } from "./features/participantes/transportadoras/TransportadorasPage.jsx";
import { ControleAcessoPage } from "./features/sistema/controleAcesso/ControleAcessoPage.jsx";
import { FaturarPedidoVendaPage } from "./features/vendas/FaturarPedidoVendaPage.jsx";
import { NovoPedidoVendaPage } from "./features/vendas/NovoPedidoVendaPage.jsx";
import { PedidoVendaDetailPage } from "./features/vendas/PedidoVendaDetailPage.jsx";
import { PedidosVendaListPage } from "./features/vendas/PedidosVendaListPage.jsx";
import { ProtectedRoute } from "./routes/ProtectedRoute.jsx";

function AppRoutes() {
  const { session, loading, sessaoEncerradaMotivo, limparAvisoSessaoEncerrada } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!sessaoEncerradaMotivo) return;
    toast.error(sessaoEncerradaMotivo, { duration: 8000 });
    limparAvisoSessaoEncerrada();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessaoEncerradaMotivo]);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vendas" element={<PedidosVendaListPage />} />
        <Route path="/vendas/novo" element={<NovoPedidoVendaPage />} />
        <Route path="/vendas/:id" element={<PedidoVendaDetailPage />} />
        <Route path="/vendas/:id/faturar" element={<FaturarPedidoVendaPage />} />
        <Route path="/compras" element={<PedidosCompraListPage />} />
        <Route path="/compras/novo" element={<NovoPedidoCompraPage />} />
        <Route path="/compras/:id" element={<PedidoCompraDetailPage />} />
        <Route path="/compras/:id/recebimento" element={<RecebimentoPedidoCompraPage />} />
        <Route path="/estoque" element={<LotesPage />} />
        <Route path="/estoque/inventarios" element={<InventariosPage />} />
        <Route path="/estoque/inventarios/novo" element={<NovoInventarioPage />} />
        <Route path="/estoque/inventarios/:id" element={<InventarioDetailPage />} />
        <Route path="/estoque/caixas-embalagem" element={<CaixasEmbalagemPage />} />

        <Route path="/cadastros/departamentos" element={<DepartamentosPage />} />
        <Route path="/cadastros/categorias" element={<CategoriasPage />} />
        <Route path="/cadastros/unidades-medida" element={<UnidadesMedidaPage />} />
        <Route path="/cadastros/condicoes-pagamento" element={<CondicoesPagamentoPage />} />
        <Route path="/cadastros/produtos" element={<ProdutosPage />} />
        <Route path="/cadastros/tabelas-preco" element={<TabelasPrecoPage />} />
        <Route path="/cadastros/tabelas-preco/:id/itens" element={<TabelaPrecoItensPage />} />

        <Route path="/participantes" element={<ParticipantesPage />} />
        <Route path="/participantes/clientes" element={<ClientesPage />} />
        <Route path="/participantes/grupos-empresas" element={<GruposEmpresasPage />} />
        <Route path="/participantes/transportadoras" element={<TransportadorasPage />} />
        <Route path="/participantes/rotas-entrega" element={<RotasEntregaPage />} />
        <Route path="/participantes/colaboradores" element={<ColaboradoresPage />} />

        <Route path="/financeiro/titulos" element={<TitulosPage />} />
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

        <Route path="/sistema/controle-acesso" element={<ControleAcessoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RealtimeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </RealtimeProvider>
      </AuthProvider>
    </Router>
  );
}
