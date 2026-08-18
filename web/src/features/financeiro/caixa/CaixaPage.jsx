import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { criarMovimentoCaixa, listMovimentosCaixa } from "./api.js";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const formInicial = { tipo: "ENTRADA", valor: "", descricao: "" };

export function CaixaPage() {
  const toast = useToast();
  const [movimentos, setMovimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const { items } = await listMovimentosCaixa();
      setMovimentos(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os movimentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeInvalidate("/financeiro/caixa/movimentos", carregar);

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await criarMovimentoCaixa(form);
      toast.success("Movimento registrado.");
      setModalAberto(false);
      setForm(formInicial);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar o movimento.");
    } finally {
      setSalvando(false);
    }
  }

  const columns = [
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
    {
      key: "tipo",
      label: "Tipo",
      render: (row) => <Badge tone={row.tipo === "ENTRADA" ? "success" : "danger"}>{row.tipo === "ENTRADA" ? "Entrada" : "Saída"}</Badge>,
    },
    { key: "valor", label: "Valor", render: (row) => formatarMoeda(row.valor) },
    { key: "descricao", label: "Descrição" },
  ];

  return (
    <div>
      <div className="crud-header">
        <div>
          <h1>Caixa</h1>
          <p>Movimentos de entrada e saída de caixa.</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>Novo movimento</Button>
      </div>

      <DataTable columns={columns} rows={movimentos} loading={carregando} emptyMessage="Nenhum movimento encontrado." />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Novo movimento de caixa"
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
          <Select label="Tipo" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </Select>
          <Input
            label="Valor"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.valor}
            onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
          />
          <Input
            label="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}
