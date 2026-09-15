import { useEffect, useState } from "react";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { listDepartamentosOptions } from "../../cadastros/departamentos/api.js";
import { FornecedorAutocomplete } from "../../compras/components/FornecedorAutocomplete.jsx";
import { listRecebimento } from "../api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

// Colunas copiadas da referência (MAPEAMENTO_ESTOQUE_SPACESOFT.md seção 7):
// PRODUTO/FORNECEDOR/QTD/UND/SALDO/VALIDADE/TEMP./LOTE/SIF/ALIM./ENTR./VEÍC.
// Gaps: "RECEB." (quantidade já conferida, distinta de QTD) não existe no
// schema — aqui o lote nasce inteiro no recebimento (sem conferência
// parcial), então QTD já cobre o mesmo papel; "ALIM." (indicador "é
// alimento") também não tem campo equivalente, mostrado como "—".
export function RecebimentoPage() {
  const toast = useToast();
  const [fornecedor, setFornecedor] = useState(null);
  const [departamentoId, setDepartamentoId] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [apenasPendente, setApenasPendente] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listDepartamentosOptions().then(setDepartamentos);
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listRecebimento({
      fornecedorId: fornecedor?.participanteId,
      departamentoId: departamentoId || undefined,
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
      apenasPendente: apenasPendente || undefined,
    })
      .then(({ items }) => {
        if (ativo) setLotes(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os recebimentos.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fornecedor, departamentoId, dataInicial, dataFinal, apenasPendente]);

  const columns = [
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.fornecedor?.participante.razaoSocial ?? "—" },
    { key: "qtd", label: "Qtd.", render: (row) => row.quantidadeInicial },
    { key: "und", label: "Und.", render: (row) => row.produto.unidadeMedida?.sigla ?? "—" },
    { key: "saldo", label: "Saldo", render: (row) => row.quantidadeAtual },
    { key: "validade", label: "Validade", render: (row) => formatarData(row.dataValidade) },
    { key: "temp", label: "Temp.", render: (row) => row.temperaturaRecebimento ?? "—" },
    { key: "lote", label: "Lote", render: (row) => row.id.slice(0, 8) },
    { key: "sif", label: "SIF", render: (row) => row.sif ?? "—" },
    { key: "alim", label: "Alim.", render: () => "—" },
    { key: "entr", label: "Entr.", render: (row) => formatarData(row.dataRecebimento) },
    { key: "veic", label: "Veíc.", render: (row) => row.veiculo ?? "—" },
  ];

  return (
    <div>
      <span className="eyebrow">Estoque</span>
      <h1>Terminal de Recebimento</h1>
      <p>Conferência dos lotes recebidos: validade, SIF, temperatura e veículo.</p>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
          <div style={{ minWidth: "240px" }}>
            <FornecedorAutocomplete selecionado={fornecedor} onSelecionar={setFornecedor} onLimpar={() => setFornecedor(null)} />
          </div>
          <Select label="Departamento" value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
            <option value="">Todos</option>
            {departamentos.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={apenasPendente} onChange={(e) => setApenasPendente(e.target.checked)} />
            Apenas pendente
          </label>
        </div>
      </Card>

      <DataTable columns={columns} rows={lotes} loading={carregando} emptyMessage="Nenhum recebimento encontrado para este filtro." />
    </div>
  );
}
