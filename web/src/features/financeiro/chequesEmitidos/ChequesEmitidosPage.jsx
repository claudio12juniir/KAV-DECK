import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { listContasBancariasOptions } from "../contasBancarias/api.js";
import { atualizarStatusChequeEmitido, criarChequeEmitido, listChequesEmitidos } from "./api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_TONE = { EM_CARTEIRA: "neutral", COMPENSADO: "success", DEVOLVIDO: "danger" };
const STATUS_LABEL = { EM_CARTEIRA: "Em carteira", COMPENSADO: "Compensado", DEVOLVIDO: "Devolvido" };

const formInicial = { contaBancariaId: "", numero: "", valor: "" };

export function ChequesEmitidosPage() {
  const toast = useToast();
  const [cheques, setCheques] = useState([]);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [salvando, setSalvando] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      const { items } = await listChequesEmitidos();
      setCheques(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os cheques.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    listContasBancariasOptions().then(setContas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await criarChequeEmitido(form);
      toast.success("Cheque emitido registrado.");
      setModalAberto(false);
      setForm(formInicial);
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
      await atualizarStatusChequeEmitido(id, status);
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
          <h1>Cheques emitidos</h1>
          <p>Cheques próprios em circulação até compensação.</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>Novo cheque</Button>
      </div>

      <DataTable columns={columns} rows={cheques} loading={carregando} emptyMessage="Nenhum cheque encontrado." />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Novo cheque emitido"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={salvando}>
              Salvar
            </Button>
          </>
        }
      >
        <form className="crud-form" onSubmit={handleSalvar}>
          <Select
            label="Conta bancária"
            required
            value={form.contaBancariaId}
            onChange={(e) => setForm((p) => ({ ...p, contaBancariaId: e.target.value }))}
          >
            <option value="">Selecione...</option>
            {contas.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Input
            label="Número do cheque"
            required
            value={form.numero}
            onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
          />
          <Input
            label="Valor"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.valor}
            onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}
