import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { listNotasFiscais } from "./api.js";
import { StatusNotaBadge } from "./StatusNotaBadge.jsx";

const TIPO_LABEL = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  PRODUTOR_RURAL: "Produtor rural",
  TERCEIROS: "Terceiros",
  INUTILIZACAO: "Inutilização",
};

export function NotasFiscaisPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tipoOperacao, setTipoOperacao] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listNotasFiscais({ tipoOperacao: tipoOperacao || undefined, status: status || undefined })
      .then(({ items }) => {
        if (ativo) setNotas(items);
      })
      .catch((err) => {
        if (ativo) toast.error(err.message ?? "Não foi possível carregar as notas fiscais.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoOperacao, status]);

  const columns = [
    { key: "serieNumero", label: "Nota", render: (row) => `${row.serie}/${row.numero}` },
    { key: "participante", label: "Participante", render: (row) => row.participante.razaoSocial },
    { key: "tipoOperacao", label: "Tipo", render: (row) => TIPO_LABEL[row.tipoOperacao] ?? row.tipoOperacao },
    { key: "status", label: "Status", render: (row) => <StatusNotaBadge status={row.status} /> },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1>Notas fiscais</h1>
          <p>Ciclo de digitação até autorização (a transmissão real à SEFAZ ainda não está integrada).</p>
        </div>
        <Link to="/fiscal/notas/nova">
          <Button>Nova nota</Button>
        </Link>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div style={{ maxWidth: "220px", flex: 1 }}>
          <Select label="Tipo" value={tipoOperacao} onChange={(e) => setTipoOperacao(e.target.value)}>
            <option value="">Todos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="PRODUTOR_RURAL">Produtor rural</option>
            <option value="TERCEIROS">Terceiros</option>
            <option value="INUTILIZACAO">Inutilização</option>
          </Select>
        </div>
        <div style={{ maxWidth: "220px", flex: 1 }}>
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
      </div>

      <DataTable
        columns={columns}
        rows={notas}
        loading={carregando}
        onRowClick={(row) => navigate(`/fiscal/notas/${row.id}`)}
        emptyMessage="Nenhuma nota fiscal encontrada."
      />
    </div>
  );
}
