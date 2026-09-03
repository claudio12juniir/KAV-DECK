import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { createOcorrencia, listOcorrencias } from "../api.js";
import { ClienteAutocomplete } from "../components/ClienteAutocomplete.jsx";
import { PedidoVendaSelect } from "../components/PedidoVendaSelect.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function OcorrenciasPage() {
  const toast = useToast();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [pedidoId, setPedidoId] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [tipo, setTipo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(hoje());
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listOcorrencias({ pageSize: 50 })
      .then(({ items }) => ativo && setOcorrencias(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar as ocorrências."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const podeRegistrar = tipo.trim().length > 0 && motivo.trim().length >= 3 && !registrando;

  async function handleRegistrar() {
    setRegistrando(true);
    try {
      await createOcorrencia({
        pedidoVendaId: pedidoId || undefined,
        clienteId: cliente?.participanteId || undefined,
        tipo: tipo.trim(),
        motivo: motivo.trim(),
        data: data || undefined,
      });
      toast.success("Ocorrência registrada com sucesso.");
      setPedidoId(null);
      setCliente(null);
      setTipo("");
      setMotivo("");
      setData(hoje());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar a ocorrência.");
    } finally {
      setRegistrando(false);
    }
  }

  const columns = [
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
    { key: "tipo", label: "Tipo" },
    { key: "motivo", label: "Motivo" },
    { key: "cliente", label: "Cliente", render: (row) => row.cliente?.participante.razaoSocial ?? "—" },
  ];

  return (
    <div>
      <h1>Ocorrências</h1>
      <p>Registre problemas ou exceções ligados a um pedido de venda ou cliente (ex.: avaria, atraso, divergência).</p>

      <Card style={{ marginBottom: "24px", maxWidth: "600px" }}>
        <h3>Nova ocorrência</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PedidoVendaSelect label="Pedido de venda (opcional)" value={pedidoId} onChange={setPedidoId} />
          <ClienteAutocomplete
            selecionado={cliente}
            onSelecionar={setCliente}
            onLimpar={() => setCliente(null)}
            permitirSemCadastro={false}
          />
          <Input
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="Ex.: Avaria, Atraso, Divergência..."
          />
          <div className="field">
            <label className="field-label">Motivo</label>
            <textarea className="field-control" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <Input label="Data da ocorrência" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Button onClick={handleRegistrar} loading={registrando} disabled={!podeRegistrar} style={{ alignSelf: "flex-start" }}>
            Registrar ocorrência
          </Button>
        </div>
      </Card>

      <h3>Ocorrências registradas</h3>
      <DataTable columns={columns} rows={ocorrencias} loading={carregando} emptyMessage="Nenhuma ocorrência registrada." />
    </div>
  );
}
