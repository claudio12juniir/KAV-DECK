import { useEffect, useState } from "react";
import { produtosApi } from "../cadastros/produtos/api.js";
import { listPedidosCompra } from "../compras/api.js";
import { listTitulos } from "../financeiro/titulos/api.js";
import { listClientes } from "../participantes/clientes/api.js";
import { listPedidosVenda } from "../vendas/api.js";
import "./DashboardStats.css";

const ATUALIZAR_A_CADA_MS = 30000;

const DEFINICOES = [
  {
    key: "vendasAbertas",
    label: "Pedidos de venda em aberto",
    tone: "accent",
    buscar: () => listPedidosVenda({ status: "ABERTO", pageSize: 1 }).then((r) => r.pagination.total),
  },
  {
    key: "comprasAbertas",
    label: "Pedidos de compra em aberto",
    tone: "neutral",
    buscar: () => listPedidosCompra({ status: "ABERTO", pageSize: 1 }).then((r) => r.pagination.total),
  },
  {
    key: "titulosPagar",
    label: "Títulos a pagar em aberto",
    tone: "warning",
    buscar: () => listTitulos({ tipo: "PAGAR", status: "ABERTO", pageSize: 1 }).then((r) => r.pagination.total),
  },
  {
    key: "titulosReceber",
    label: "Títulos a receber em aberto",
    tone: "success",
    buscar: () => listTitulos({ tipo: "RECEBER", status: "ABERTO", pageSize: 1 }).then((r) => r.pagination.total),
  },
  {
    key: "produtosAtivos",
    label: "Produtos ativos",
    tone: "neutral",
    buscar: () => produtosApi.list({ ativo: "true", pageSize: 1 }).then((r) => r.pagination.total),
  },
  {
    key: "clientesBloqueados",
    label: "Clientes bloqueados",
    tone: "danger",
    buscar: () =>
      listClientes({ pageSize: 100 }).then(
        (r) => r.items.filter((c) => c.bloqueioFinanceiro === "BLOQUEADO").length,
      ),
  },
];

export function DashboardStats() {
  const [valores, setValores] = useState({});

  useEffect(() => {
    let ativo = true;

    async function atualizar() {
      const resultados = await Promise.allSettled(DEFINICOES.map((d) => d.buscar()));
      if (!ativo) return;
      setValores((prev) => {
        const proximo = { ...prev };
        resultados.forEach((resultado, index) => {
          const key = DEFINICOES[index].key;
          proximo[key] = resultado.status === "fulfilled" ? resultado.value : null;
        });
        return proximo;
      });
    }

    atualizar();
    const id = setInterval(atualizar, ATUALIZAR_A_CADA_MS);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="stats-grid">
      {DEFINICOES.map((d) => (
        <div key={d.key} className={`stat-tile stat-tile-${d.tone}`}>
          <div className="stat-tile-value">{valores[d.key] ?? "—"}</div>
          <div className="stat-tile-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
