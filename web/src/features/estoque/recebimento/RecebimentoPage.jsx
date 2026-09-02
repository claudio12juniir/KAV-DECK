import { useEffect, useState } from "react";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { FornecedorAutocomplete } from "../../compras/components/FornecedorAutocomplete.jsx";
import { listRecebimento } from "../api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

// Diferente do Space Soft, onde o Terminal de Recebimento é uma tela de
// conferência separada que fica vazia se ninguém a preencher manualmente
// (ver MAPEAMENTO_ESTOQUE_SPACESOFT.md seção 7), aqui SIF/temperatura/
// veículo/validade já são gravados no lote no momento do recebimento da
// compra — esta tela é só consulta.
export function RecebimentoPage() {
  const toast = useToast();
  const [fornecedor, setFornecedor] = useState(null);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [lotes, setLotes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listRecebimento({
      fornecedorId: fornecedor?.participanteId,
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
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
  }, [fornecedor, dataInicial, dataFinal]);

  const columns = [
    { key: "produto", label: "Produto", render: (row) => `${row.produto.descricao} (${row.produto.codigo})` },
    { key: "fornecedor", label: "Fornecedor", render: (row) => row.fornecedor?.participante.razaoSocial ?? "—" },
    { key: "dataRecebimento", label: "Recebido em", render: (row) => formatarData(row.dataRecebimento) },
    { key: "dataValidade", label: "Validade", render: (row) => formatarData(row.dataValidade) },
    { key: "sif", label: "SIF", render: (row) => row.sif ?? "—" },
    { key: "temperaturaRecebimento", label: "Temperatura", render: (row) => row.temperaturaRecebimento ?? "—" },
    { key: "veiculo", label: "Veículo", render: (row) => row.veiculo ?? "—" },
    { key: "quantidadeAtual", label: "Saldo atual" },
  ];

  return (
    <div>
      <h1>Terminal de recebimento</h1>
      <p>Conferência dos lotes recebidos: validade, SIF, temperatura e veículo.</p>

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: "280px" }}>
            <FornecedorAutocomplete
              selecionado={fornecedor}
              onSelecionar={setFornecedor}
              onLimpar={() => setFornecedor(null)}
            />
          </div>
          <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={lotes}
        loading={carregando}
        emptyMessage="Nenhum recebimento encontrado para este filtro."
      />
    </div>
  );
}
