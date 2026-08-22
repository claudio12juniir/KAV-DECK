import { useEffect, useRef, useState } from "react";
import { FiDollarSign, FiHome, FiPackage, FiShoppingCart, FiTruck } from "react-icons/fi";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CardNavMenu } from "../effects/CardNavMenu.jsx";
import { Dock } from "../effects/Dock.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import "./AppShell.css";

const NAV_GROUPS = [
  { label: "Início", to: "/", end: true },
  { label: "Vendas", to: "/vendas" },
  { label: "Compras", to: "/compras" },
  {
    label: "Estoque",
    items: [
      { to: "/estoque", label: "Lotes" },
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
      { to: "/financeiro/titulos", label: "Títulos" },
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

function NavGroup({ group, onNavigate }) {
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
      <NavLink
        to={group.to}
        end={group.end}
        className={({ isActive }) => `app-nav-link ${isActive ? "is-active" : ""}`}
        onClick={onNavigate}
      >
        {group.label}
      </NavLink>
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
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-nav-dropdown-link ${isActive ? "is-active" : ""}`}
              onClick={() => {
                setAberto(false);
                onNavigate();
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const { me, signOut } = useAuth();
  const navigate = useNavigate();
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
              <NavGroup key={group.label} group={group} onNavigate={() => {}} />
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

      <CardNavMenu groups={MOBILE_GROUPS} />

      <main className="app-content container">
        <Outlet />
      </main>

      <Dock items={dockItems} />
    </div>
  );
}
