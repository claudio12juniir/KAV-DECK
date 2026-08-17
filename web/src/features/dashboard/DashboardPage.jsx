import { FiArchive, FiList, FiShoppingCart, FiTruck } from "react-icons/fi";
import { GlassIcons } from "../../components/effects/GlassIcons.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { DashboardStats } from "./DashboardStats.jsx";
import { DigitalClock } from "./DigitalClock.jsx";
import "./DashboardPage.css";

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

const ACESSO_RAPIDO = [
  { label: "Novo pedido de venda", to: "/vendas/novo", icon: <FiShoppingCart />, tone: "accent" },
  { label: "Pedidos de venda", to: "/vendas", icon: <FiList />, tone: "mono" },
  { label: "Novo pedido de compra", to: "/compras/novo", icon: <FiTruck />, tone: "accent" },
  { label: "Pedidos de compra", to: "/compras", icon: <FiArchive />, tone: "mono" },
];

export function DashboardPage() {
  const { me } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-main">
          <span className="eyebrow">{saudacao()}</span>
          <h1>Olá, {me?.nome?.split(" ")[0] ?? "!"}</h1>
          <p>Aqui está um resumo do seu KAV DECK agora.</p>

          <span className="eyebrow dashboard-section-title">Acesso rápido</span>
          <GlassIcons items={ACESSO_RAPIDO} />
        </div>

        <DigitalClock />
      </div>

      <DashboardStats />
    </div>
  );
}
