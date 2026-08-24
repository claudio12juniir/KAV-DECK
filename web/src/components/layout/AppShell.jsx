import { useEffect, useRef, useState } from "react";
import { FiDollarSign, FiHome, FiPackage, FiShoppingCart, FiTruck } from "react-icons/fi";
import { MemoryRouter } from "react-router-dom";
import { CardNavMenu } from "../effects/CardNavMenu.jsx";
import { Dock } from "../effects/Dock.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { TabsProvider, useTabs } from "../../contexts/TabsContext.jsx";
import { WorkspaceRoutes } from "../../routes/WorkspaceRoutes.jsx";
import { TabsSidebar } from "./TabsSidebar.jsx";
import "./AppShell.css";

const NAV_GROUPS = [
  { label: "Início", to: "/", end: true },
  { label: "Vendas", to: "/vendas" },
  { label: "Compras", to: "/compras" },
  {
    label: "Estoque",
    items: [
      { to: "/estoque", label: "Lotes" },
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

const MOBILE_GROUPS = [
  {
    label: "Operações",
    items: [
      { to: "/", label: "Início", end: true },
      { to: "/vendas", label: "Vendas" },
      { to: "/compras", label: "Compras" },
      { to: "/estoque", label: "Estoque" },
    ],
  },
  {
    label: "Financeiro & Fiscal",
    items: [
      { to: "/financeiro/titulos", label: "Títulos" },
      { to: "/financeiro/caixa", label: "Caixa" },
      { to: "/fiscal/notas", label: "Notas fiscais" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { to: "/cadastros/produtos", label: "Produtos" },
      { to: "/participantes/clientes", label: "Clientes" },
      { to: "/participantes", label: "Participantes" },
    ],
  },
];

// group.to (item de nível único, ex: "Início") ou group.items (dropdown)
// sempre abrem/focam uma aba em vez de navegar a URL real — ver
// TabsContext.jsx pro porquê.
function NavGroup({ group, abaAtivaPath, onAbrirAba }) {
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
        className={`app-nav-link ${abaAtivaPath === group.to ? "is-active" : ""}`}
        onClick={() => onAbrirAba(group.to, group.label)}
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
              className={`app-nav-dropdown-link ${abaAtivaPath === item.to ? "is-active" : ""}`}
              onClick={() => {
                setAberto(false);
                onAbrirAba(item.to, item.label);
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

function AppShellConteudo() {
  const { me, signOut } = useAuth();
  const { tabs, activeTabId, openTab } = useTabs();
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

  const abaAtiva = tabs.find((t) => t.id === activeTabId);

  const dockItems = [
    { label: "Início", icon: <FiHome />, onClick: () => openTab("/", "Início") },
    { label: "Novo pedido de venda", icon: <FiShoppingCart />, onClick: () => openTab("/vendas/novo", "Novo pedido de venda") },
    { label: "Novo pedido de compra", icon: <FiTruck />, onClick: () => openTab("/compras/novo", "Novo pedido de compra") },
    { label: "Estoque", icon: <FiPackage />, onClick: () => openTab("/estoque", "Estoque") },
    { label: "Títulos", icon: <FiDollarSign />, onClick: () => openTab("/financeiro/titulos", "Títulos") },
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
              <NavGroup key={group.label} group={group} abaAtivaPath={abaAtiva?.path} onAbrirAba={openTab} />
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

      <CardNavMenu groups={MOBILE_GROUPS} onAbrirAba={openTab} />

      <div className="app-body">
        <TabsSidebar />

        <main className="app-content container">
          {/* Cada aba tem seu próprio <MemoryRouter> — todas ficam montadas o
              tempo todo (só a ativa fica visível), por isso trocar de aba
              preserva formulário, scroll, dado já carregado etc. sem
              recarregar nada. */}
          {tabs.map((tab) => (
            <div key={tab.id} style={{ display: tab.id === activeTabId ? "block" : "none" }}>
              <MemoryRouter initialEntries={[tab.path]}>
                <WorkspaceRoutes />
              </MemoryRouter>
            </div>
          ))}
        </main>
      </div>

      <Dock items={dockItems} />
    </div>
  );
}

export function AppShell() {
  return (
    <TabsProvider tabInicial={{ path: "/", label: "Início" }}>
      <AppShellConteudo />
    </TabsProvider>
  );
}
