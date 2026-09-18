import { useEffect, useState } from "react";
import { Input } from "../../../components/ui/Input.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { StatusNotaBadge } from "../notasFiscais/StatusNotaBadge.jsx";
import { listItensNotaFiscal } from "./api.js";

const TIPO_LABEL = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  PRODUTOR_RURAL: "Produtor rural",
  TERCEIROS: "Terceiros",
  INUTILIZACAO: "Inutilização",
};

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

const columns = [
  { key: "nota", label: "Nota", render: (row) => `${row.notaFiscal.serie}/${row.notaFiscal.numero}` },
  { key: "dataEmissao", label: "Emissão", render: (row) => formatarData(row.notaFiscal.dataEmissao) },
  { key: "participante", label: "Participante", render: (row) => row.notaFiscal.participante.razaoSocial },
  { key: "status", label: "Status", render: (row) => <StatusNotaBadge status={row.notaFiscal.status} /> },
  { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
  { key: "cfop", label: "CFOP", render: (row) => row.cfop.codigo },
  { key: "quantidade", label: "Qtd." },
  { key: "valorUnitario", label: "Valor unit.", render: (row) => formatarMoeda(row.valorUnitario) },
  { key: "valorIcms", label: "ICMS", render: (row) => formatarMoeda(row.valorIcms) },
  { key: "valorIpi", label: "IPI", render: (row) => formatarMoeda(row.valorIpi) },
  { key: "valorPis", label: "PIS", render: (row) => formatarMoeda(row.valorPis) },
  { key: "valorCofins", label: "COFINS", render: (row) => formatarMoeda(row.valorCofins) },
];

export function ItensNotaFiscalPage() {
  const toast = useToast();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tipoOperacao, setTipoOperacao] = useState("");
  const [status, setStatus] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listItensNotaFiscal({
      tipoOperacao: tipoOperacao || undefined,
      status: status || undefined,
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
    })
      .then(({ items }) => {
        if (ativo) setItens(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar os itens de notas fiscais.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoOperacao, status, dataInicial, dataFinal]);

  return (
    <div>
      <h1>Consulta de Itens da Nota Fiscal</h1>
      <p>Todos os itens tributados, cruzando todas as notas fiscais num único grid.</p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", margin: "20px 0" }}>
        <div style={{ maxWidth: "200px", flex: 1 }}>
          <Select label="Tipo" value={tipoOperacao} onChange={(e) => setTipoOperacao(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(TIPO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ maxWidth: "200px", flex: 1 }}>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="EM_DIGITACAO">Em digitação</option>
            <option value="EM_PROCESSAMENTO">Em processamento</option>
            <option value="AUTORIZADO">Autorizado</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="USO_DENEGADO">Uso denegado</option>
            <option value="REJEICAO">Rejeitado</option>
          </Select>
        </div>
        <Input label="De" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Até" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
      </div>

      <DataTable columns={columns} rows={itens} loading={carregando} emptyMessage="Nenhum item encontrado." />
    </div>
  );
}
