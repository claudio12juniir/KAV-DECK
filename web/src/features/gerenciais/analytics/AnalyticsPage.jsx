import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { analyticsApi } from "./api.js";
import "../relatorios/RelatoriosPage.css";

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

const CLASSE_TONE = { A: "success", B: "warning", C: "neutral" };

const ABAS = [
  { id: "produtos", label: "Curva ABC de Produtos" },
  { id: "clientes", label: "Curva ABC de Clientes" },
  { id: "fornecedores", label: "Curva ABC de Fornecedores" },
];

function TabelaAbc({ itens, colunaNome, colunaLabel, colunaExtra, idField }) {
  const columns = [
    { key: "nome", label: colunaLabel, render: (row) => row[colunaNome] },
    ...(colunaExtra ? [colunaExtra] : []),
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
    { key: "percentualAcumulado", label: "% acumulado", render: (row) => `${row.percentualAcumulado}%` },
    { key: "classe", label: "Classe", render: (row) => <Badge tone={CLASSE_TONE[row.classe]}>{row.classe}</Badge> },
  ];
  const rows = itens.map((item, index) => ({ id: item[idField] ?? index, ...item }));
  return <DataTable columns={columns} rows={rows} emptyMessage="Nenhum registro no período." />;
}

export function AnalyticsPage() {
  const toast = useToast();
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [aba, setAba] = useState("produtos");
  const [dados, setDados] = useState({ produtos: [], clientes: [], fornecedores: [] });
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const params = { dataInicial: dataInicial || undefined, dataFinal: dataFinal || undefined };
      const [produtos, clientes, fornecedores] = await Promise.all([
        analyticsApi.curvaAbcProdutos(params),
        analyticsApi.curvaAbcClientes(params),
        analyticsApi.curvaAbcFornecedores(params),
      ]);
      setDados({ produtos: produtos.items, clientes: clientes.items, fornecedores: fornecedores.items });
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o Analytics.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1>Analytics</h1>
        <p>
          Curva ABC — classe A concentra até 80% do valor acumulado, B até 95%, C o restante. Sem filtro de data,
          considera todo o histórico.
        </p>
      </div>

      <Card className="relatorio-filtro">
        <Input label="De" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Até" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        <Button loading={carregando} onClick={carregar} style={{ alignSelf: "flex-end" }}>
          Atualizar
        </Button>
      </Card>

      <div className="relatorio-abas">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`relatorio-aba ${aba === item.id ? "is-active" : ""}`}
            onClick={() => setAba(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        {aba === "produtos" && (
          <TabelaAbc
            itens={dados.produtos}
            idField="produtoId"
            colunaNome="descricao"
            colunaLabel="Produto"
            colunaExtra={{ key: "quantidade", label: "Quantidade", render: (row) => row.quantidade }}
          />
        )}
        {aba === "clientes" && (
          <TabelaAbc
            itens={dados.clientes}
            idField="clienteId"
            colunaNome="razaoSocial"
            colunaLabel="Cliente"
            colunaExtra={{ key: "pedidos", label: "Pedidos", render: (row) => row.pedidos }}
          />
        )}
        {aba === "fornecedores" && (
          <TabelaAbc
            itens={dados.fornecedores}
            idField="fornecedorId"
            colunaNome="razaoSocial"
            colunaLabel="Fornecedor"
            colunaExtra={{ key: "pedidos", label: "Pedidos", render: (row) => row.pedidos }}
          />
        )}
      </Card>
    </div>
  );
}
