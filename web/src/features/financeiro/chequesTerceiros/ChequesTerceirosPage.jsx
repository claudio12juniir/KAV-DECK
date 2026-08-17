import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { ParticipanteAutocomplete } from "../../shared/ParticipanteAutocomplete.jsx";
import { atualizarStatusChequeTerceiro, criarChequeTerceiro, listChequesTerceiros } from "./api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_TONE = { EM_CARTEIRA: "neutral", COMPENSADO: "success", DEVOLVIDO: "danger" };
const STATUS_LABEL = { EM_CARTEIRA: "Em carteira", COMPENSADO: "Compensado", DEVOLVIDO: "Devolvido" };

export function ChequesTerceirosPage() {
  const toast = useToast();
  const [cheques, setCheques] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [participante, setParticipante] = useState(null);
  const [numero, setNumero] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      const { items } = await listChequesTerceiros();
      setCheques(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os cheques.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fecharModal() {
    setModalAberto(false);
    setParticipante(null);
    setNumero("");
    setValor("");
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await criarChequeTerceiro({ participanteId: participante.id, numero, valor });
      toast.success("Cheque de terceiro registrado.");
      fecharModal();
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar o cheque.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleStatus(id, status) {
    setAtualizandoId(id);
    try {
      await atualizarStatusChequeTerceiro(id, status);
      toast.success(status === "COMPENSADO" ? "Cheque compensado." : "Cheque devolvido.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o cheque.");
    } finally {
      setAtualizandoId(null);
    }
  }

  const columns = [
    { key: "numero", label: "Número" },
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
    {
      key: "status",
      label: "Situação",
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
    },
    {
      key: "_acoes",
      label: "",
      render: (row) =>
        row.status === "EM_CARTEIRA" && (
          <div className="crud-row-actions">
            <button
              type="button"
              className="autocomplete-trocar"
              disabled={atualizandoId === row.id}
              onClick={() => handleStatus(row.id, "COMPENSADO")}
            >
              Compensar
            </button>
            <button
              type="button"
              className="autocomplete-trocar"
              style={{ color: "var(--color-danger)" }}
              disabled={atualizandoId === row.id}
              onClick={() => handleStatus(row.id, "DEVOLVIDO")}
            >
              Devolver
            </button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <div className="crud-header">
        <div>
          <h1>Cheques de terceiros</h1>
          <p>Cheques recebidos de clientes até compensação.</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>Novo cheque</Button>
      </div>

      <DataTable columns={columns} rows={cheques} loading={carregando} emptyMessage="Nenhum cheque encontrado." />

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title="Novo cheque de terceiro"
        footer={
          <>
            <Button variant="ghost" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={salvando} disabled={!participante}>
              Salvar
            </Button>
          </>
        }
      >
        <form className="crud-form" onSubmit={handleSalvar}>
          <div>
            <div className="field-label" style={{ marginBottom: "6px" }}>
              Participante
            </div>
            <ParticipanteAutocomplete
              selecionado={participante}
              onSelecionar={setParticipante}
              onLimpar={() => setParticipante(null)}
            />
          </div>
          <Input label="Número do cheque" required value={numero} onChange={(e) => setNumero(e.target.value)} />
          <Input
            label="Valor"
            type="number"
            min="0"
            step="0.01"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
