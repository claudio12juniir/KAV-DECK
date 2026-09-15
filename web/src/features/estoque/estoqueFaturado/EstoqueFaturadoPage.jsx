import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { listDepartamentosOptions } from "../../cadastros/departamentos/api.js";
import { consultarEstoqueFaturado } from "./api.js";

// Layout e colunas copiados 1:1 da referência (MAPEAMENTO_ESTOQUE_SPACESOFT.md
// seção 4: CÓDIGO/DESCRIÇÃO/SALDO/MÍNIMO/MÁXIMO/PREV.VENDA/SALDO PREV.,
// filtro Departamento/Ordenação/Produto/Pesquisar + "Gerar relatório"). O
// achado da mesma seção — a referência devolve lista vazia sem explicação
// quando nenhum produto tem mínimo/máximo cadastrado — foi corrigido aqui:
// mensagem explícita em vez de grid muda (recomendação 7 do mapeamento).
export function EstoqueFaturadoPage() {
  const toast = useToast();
  const [departamentoId, setDepartamentoId] = useState("");
  const [ordenacao, setOrdenacao] = useState("PRODUTO");
  const [produto, setProduto] = useState("");
  const [departamentos, setDepartamentos] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listDepartamentosOptions().then(setDepartamentos);
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    consultarEstoqueFaturado({ departamentoId: departamentoId || undefined, produto: produto || undefined, ordenacao })
      .then(({ items }) => ativo && setLinhas(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar o estoque faturado."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departamentoId, produto, ordenacao, refreshKey]);

  useRealtimeInvalidate("/estoque/faturado", () => setRefreshKey((k) => k + 1));

  const nenhumComLimite = !carregando && linhas.length > 0 && linhas.every((l) => l.minimo == null && l.maximo == null);

  const columns = [
    { key: "codigo", label: "Código" },
    { key: "descricao", label: "Descrição" },
    { key: "saldo", label: "Saldo" },
    { key: "minimo", label: "Mínimo", render: (row) => row.minimo ?? "—" },
    { key: "maximo", label: "Máximo", render: (row) => row.maximo ?? "—" },
    { key: "previstoVenda", label: "Prev. venda" },
    {
      key: "saldoPrevisto",
      label: "Saldo prev.",
      render: (row) =>
        row.minimo != null ? (
          <Badge tone={Number(row.saldoPrevisto) < Number(row.minimo) ? "danger" : "success"}>{row.saldoPrevisto}</Badge>
        ) : (
          row.saldoPrevisto
        ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Estoque</span>
          <h1>Estoque Faturado</h1>
        </div>
        <Button variant="ghost" onClick={() => toast.error("Gerar relatório ainda não implementado nesta versão do KAV DECK.")}>
          Gerar relatório
        </Button>
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <Select label="Departamento" value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
            <option value="">Todos</option>
            {departamentos.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <Select label="Ordenação" value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
            <option value="PRODUTO">Produto</option>
            <option value="SALDO">Saldo em estoque</option>
          </Select>
          <Input label="Produto" value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Buscar por descrição..." />
        </div>
      </Card>

      {nenhumComLimite && (
        <div style={{ marginBottom: "16px" }}>
          <Badge tone="warning">
            Nenhum produto neste filtro tem estoque mínimo/máximo configurado — configure em Cadastros → Produtos.
          </Badge>
        </div>
      )}

      <DataTable columns={columns} rows={linhas} loading={carregando} emptyMessage="Nenhum produto encontrado para este filtro." />
    </div>
  );
}
