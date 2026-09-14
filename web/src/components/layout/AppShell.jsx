import { useEffect, useRef, useState } from "react";
import { FiDollarSign, FiHome, FiPackage, FiShoppingCart, FiTruck } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { CardNavMenu } from "../effects/CardNavMenu.jsx";
import { Dock } from "../effects/Dock.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { WorkspaceRoutes } from "../../routes/WorkspaceRoutes.jsx";
import "./AppShell.css";

const NAV_GROUPS = [
  { label: "Início", to: "/", end: true },
  {
    label: "Vendas",
    items: [
      { to: "/vendas/controle-producao", label: "Controle de Produção" },
      { to: "/vendas/consulta-itens", label: "Consulta de Itens" },
      { to: "/vendas/lista-compra", label: "Listagem para Compra" },
      { to: "/vendas", label: "Terminal de Vendas" },
      { to: "/vendas/terminal-precos", label: "Terminal de Preços" },
      { to: "/vendas/devolucoes", label: "Devolução de Venda" },
      { to: "/vendas/separadores", label: "Terminal de Separadores" },
      { to: "/vendas/ocorrencias", label: "Ocorrência" },
      { to: "/vendas/itinerario", label: "Itinerário" },
    ],
  },
  { label: "Compras", to: "/compras" },
  {
    label: "Estoque",
    items: [
      { to: "/estoque", label: "Lotes" },
      { to: "/estoque/movimentos", label: "Movimentos" },
      { to: "/estoque/rastreabilidade", label: "Rastreabilidade" },
      { to: "/estoque/recebimento", label: "Terminal de recebimento" },
      { to: "/estoque/faturado", label: "Estoque faturado" },
      { to: "/estoque/previa", label: "Prévia de estoque" },
      { to: "/estoque/inventarios", label: "Inventários" },
      { to: "/estoque/caixas-embalagem", label: "Caixas de embalagem" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { to: "/cadastros/produtos", label: "Produtos" },
      { to: "/cadastros/categorias", label: "Categorias" },
      { to: "/cadastros/departamentos", label: "Departamentos" },
      { to: "/cadastros/unidades-medida", label: "Unidades de medida" },
      { to: "/cadastros/condicoes-pagamento", label: "Condições de pagamento" },
      { to: "/cadastros/tabelas-preco", label: "Tabelas de preço" },
      { to: "/cadastros/regras-icms", label: "ICMS" },
      { to: "/cadastros/regras-ipi", label: "IPI" },
      { to: "/cadastros/regras-pis", label: "PIS" },
      { to: "/cadastros/regras-cofins", label: "COFINS" },
      { to: "/cadastros/regras-ibs", label: "IBS" },
      { to: "/cadastros/regras-cbs", label: "CBS" },
    ],
  },
  {
    label: "Participantes",
    items: [
      { to: "/participantes", label: "Participantes" },
      { to: "/participantes/clientes", label: "Clientes" },
      { to: "/participantes/grupos-empresas", label: "Grupos de empresas" },
      { to: "/participantes/transportadoras", label: "Transportadoras" },
      { to: "/participantes/rotas-entrega", label: "Rotas de entrega" },
      { to: "/participantes/colaboradores", label: "Colaboradores" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { to: "/financeiro/titulos/receber", label: "Contas a receber" },
      { to: "/financeiro/titulos/pagar", label: "Contas a pagar" },
      { to: "/financeiro/titulos", label: "Todos os títulos" },
      { to: "/financeiro/caixa", label: "Caixa" },
      { to: "/financeiro/contas-bancarias", label: "Contas bancárias" },
      { to: "/financeiro/plano-contas", label: "Plano de contas" },
      { to: "/financeiro/centros-custo", label: "Centros de custo" },
      { to: "/financeiro/cheques-emitidos", label: "Cheques emitidos" },
      { to: "/financeiro/cheques-terceiros", label: "Cheques de terceiros" },
    ],
  },
  {
    label: "Fiscal",
    items: [
      { to: "/fiscal/notas", label: "Notas fiscais" },
      { to: "/fiscal/naturezas-operacao", label: "Naturezas de operação" },
      { to: "/fiscal/certificados-digitais", label: "Certificados digitais" },
      { to: "/fiscal/cfop", label: "CFOP" },
      { to: "/fiscal/tributacao-produto", label: "Tributação de produtos" },
    ],
  },
];

const PAPEIS_COM_ACESSO_SISTEMA = ["ADMIN", "GESTOR"];

// Deriva o menu mobile (CardNavMenu) do MESMO navGroups usado no menu
// desktop, em vez de manter uma segunda lista de links à mão — evitava
// divergir silenciosamente conforme o desktop ganhava rotas novas (era
// exatamente o que estava acontecendo: o mobile só cobria uma fração do
// que existe no site). Links soltos (group.to, ex: "Início"/"Vendas") viram
// itens de um grupo "Geral"; grupos com dropdown (group.items) passam direto.
function toMobileGroups(navGroups) {
  const soltos = navGroups.filter((g) => g.to);
  const agrupados = navGroups.filter((g) => g.items);
  const geral = soltos.length
    ? [{ label: "Geral", items: soltos.map((g) => ({ to: g.to, label: g.label, end: g.end })) }]
    : [];
  return [...geral, ...agrupados];
}

function ehAtivo(pathAtual, to, end) {
  if (end) return pathAtual === to;
  return pathAtual === to || pathAtual.startsWith(`${to}/`);
}

// group.to (item de nível único, ex: "Início") ou group.items (dropdown)
// navegam pra URL real via useNavigate — cada clique troca a página como em
// qualquer app com rota endereçável (ver App.jsx).
function NavGroup({ group, pathAtual, onNavegar }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicarFora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  if (group.to) {
    return (
      <button
        type="button"
        className={`app-nav-link ${ehAtivo(pathAtual, group.to, group.end) ? "is-active" : ""}`}
        onClick={() => onNavegar(group.to)}
      >
        {group.label}
      </button>
    );
  }

  return (
    <div className="app-nav-group" ref={ref}>
      <button
        type="button"
        className={`app-nav-link app-nav-group-trigger ${aberto ? "is-active" : ""}`}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        {group.label}
      </button>
      {aberto && (
        <div className="app-nav-dropdown">
          {group.items.map((item) => (
            <button
              type="button"
              key={item.to}
              className={`app-nav-dropdown-link ${ehAtivo(pathAtual, item.to, item.end) ? "is-active" : ""}`}
              onClick={() => {
                setAberto(false);
                onNavegar(item.to);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const { me, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const navGroups = PAPEIS_COM_ACESSO_SISTEMA.includes(me?.role)
    ? [
        ...NAV_GROUPS,
        { label: "Relatórios", to: "/relatorios" },
        {
          label: "Sistema",
          items: [
            { to: "/sistema/controle-acesso", label: "Controle de Acesso" },
            { to: "/sistema/assinatura", label: "Assinatura" },
          ],
        },
      ]
    : NAV_GROUPS;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dockItems = [
    { label: "Início", icon: <FiHome />, onClick: () => navigate("/") },
    { label: "Novo pedido de venda", icon: <FiShoppingCart />, onClick: () => navigate("/vendas/novo") },
    { label: "Novo pedido de compra", icon: <FiTruck />, onClick: () => navigate("/compras/novo") },
    { label: "Estoque", icon: <FiPackage />, onClick: () => navigate("/estoque") },
    { label: "Títulos", icon: <FiDollarSign />, onClick: () => navigate("/financeiro/titulos") },
  ];

  return (
    <div className="app-shell">
      <header className={`app-topbar ${scrolled ? "is-scrolled" : ""}`}>
        <div className="app-topbar-inner container">
          <div className="app-brand">
            KAV<span className="app-brand-dot">DECK</span>
          </div>

          <nav className="app-nav">
            {navGroups.map((group) => (
              <NavGroup key={group.label} group={group} pathAtual={location.pathname} onNavegar={navigate} />
            ))}
          </nav>

          <div className="app-user">
            <span className="app-user-nome">{me?.nome ?? "..."}</span>
            <button className="app-user-sair" onClick={signOut}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <CardNavMenu groups={toMobileGroups(navGroups)} onNavegar={navigate} />

      <main className="app-content container">
        <WorkspaceRoutes />
      </main>

      <Dock items={dockItems} />
    </div>
  );
}
