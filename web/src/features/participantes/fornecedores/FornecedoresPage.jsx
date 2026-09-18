import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { listFornecedores } from "./api.js";

const columns = [
  { key: "nome", label: "Nome", render: (row) => row.participante.razaoSocial },
  { key: "cpfCnpj", label: "CPF/CNPJ", render: (row) => row.participante.cpfCnpj },
  {
    key: "isProdutorRural",
    label: "Produtor rural",
    render: (row) => (
      <Badge tone={row.participante.isProdutorRural ? "accent" : "neutral"}>
        {row.participante.isProdutorRural ? "Sim" : "Não"}
      </Badge>
    ),
  },
  {
    key: "ativo",
    label: "Situação",
    render: (row) => (
      <Badge tone={row.participante.ativo ? "success" : "neutral"}>
        {row.participante.ativo ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

export function FornecedoresPage() {
  const toast = useToast();
  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  async function carregar(q) {
    setCarregando(true);
    try {
      const { items } = await listFornecedores(q ? { q } : undefined);
      setFornecedores(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os fornecedores.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => carregar(busca.trim() || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  useRealtimeInvalidate("/participantes/fornecedores", () => carregar(busca.trim() || undefined));

  return (
    <div>
      <h1>Fornecedores</h1>
      <p>Participantes promovidos a fornecedor — para editar dados cadastrais, acesse a tela de Participantes.</p>

      <div style={{ maxWidth: "320px", margin: "20px 0" }}>
        <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        rows={fornecedores}
        loading={carregando}
        emptyMessage="Nenhum fornecedor encontrado. Promova um participante a fornecedor na tela de Participantes."
      />
    </div>
  );
}
