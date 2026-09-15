import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { listDepartamentosOptions } from "../../cadastros/departamentos/api.js";
import { consultarPreviaEstoque } from "./api.js";

// Colunas copiadas da referência (MAPEAMENTO_ESTOQUE_SPACESOFT.md seção 3):
// UND/PRODUTO/ESTOQUE/COMPRA/SAÍDA/SALDO. Gap conhecido: a referência
// projeta dentro de uma janela de datas ("Data do estoque" → "Venda
// futura") — o KAV DECK hoje só sabe somar TUDO que está pendente em
// pedido aberto, sem filtrar por data de entrega/emissão dentro da janela
// (exigiria agregação nova no backend). O ícone de lupa que abre o modal
// "Itens - Saída" detalhado também não foi implementado — clique na linha
// não faz nada ainda.
export function PreviaEstoquePage() {
  const toast = useToast();
  const [departamentoId, setDepartamentoId] = useState("");
  const [produto, setProduto] = useState("");
  const [exibirSemMovimento, setExibirSemMovimento] = useState(false);
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
    consultarPreviaEstoque({ departamentoId: departamentoId || undefined, produto: produto || undefined, exibirSemMovimento })
      .then(({ items }) => ativo && setLinhas(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar a prévia de estoque."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departamentoId, produto, exibirSemMovimento, refreshKey]);

  useRealtimeInvalidate("/estoque/previa", () => setRefreshKey((k) => k + 1));

  const columns = [
    { key: "und", label: "Und.", render: (row) => row.unidadeMedida?.sigla ?? "—" },
    { key: "produto", label: "Produto", render: (row) => `${row.descricao} (${row.codigo})` },
    { key: "estoque", label: "Estoque", render: (row) => row.saldoAtual },
    { key: "compra", label: "Compra", render: (row) => row.aReceber },
    { key: "saida", label: "Saída", render: (row) => row.aEntregar },
    { key: "saldo", label: "Saldo", render: (row) => <strong>{row.saldoPrevisto}</strong> },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Estoque</span>
          <h1>Prévia do Estoque</h1>
        </div>
        <Button variant="ghost" onClick={() => toast.error("Copiar Saldo ainda não implementado nesta versão do KAV DECK.")}>
          Copiar Saldo
        </Button>
      </div>
      <p>Saldo projetado: o que já está fisicamente em estoque, mais o que ainda vai entrar por compras em aberto, menos o que ainda vai sair por vendas em aberto.</p>

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
          <Input label="Produto" value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Buscar por descrição..." />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={exibirSemMovimento} onChange={(e) => setExibirSemMovimento(e.target.checked)} />
            Exibir itens sem movimento
          </label>
        </div>
      </Card>

      <DataTable columns={columns} rows={linhas} loading={carregando} emptyMessage="Nenhum produto com movimentação pendente." />
    </div>
  );
}
