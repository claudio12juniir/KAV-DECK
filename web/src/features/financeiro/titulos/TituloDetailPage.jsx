import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { baixarTitulo, cancelarTitulo, getTitulo } from "./api.js";
import { FORMA_BAIXA_LABEL } from "./formaBaixa.js";
import { StatusTituloBadge } from "./StatusTituloBadge.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TituloDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [titulo, setTitulo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [valorBaixado, setValorBaixado] = useState("");
  const [formaBaixa, setFormaBaixa] = useState("");
  const [salvandoBaixa, setSalvandoBaixa] = useState(false);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await getTitulo(id);
      setTitulo(dados);
    } catch (err) {
      setErroCarregar(err.message ?? "Não foi possível carregar este título.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRealtimeInvalidate("/financeiro/titulos", carregar);

  async function handleBaixar(e) {
    e.preventDefault();
    setSalvandoBaixa(true);
    try {
      await baixarTitulo(id, { valorBaixado, formaBaixa });
      toast.success("Baixa registrada com sucesso.");
      setValorBaixado("");
      setFormaBaixa("");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar a baixa.");
    } finally {
      setSalvandoBaixa(false);
    }
  }

  async function handleCancelar() {
    setCancelando(true);
    try {
      await cancelarTitulo(id);
      toast.success("Título cancelado.");
      setConfirmarCancelamento(false);
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível cancelar o título.");
    } finally {
      setCancelando(false);
    }
  }

  if (carregando) {
    return (
      <Card>
        <SkeletonLines count={6} />
      </Card>
    );
  }

  if (erroCarregar) {
    return (
      <Card>
        <p style={{ color: "var(--color-danger)", margin: 0 }}>{erroCarregar}</p>
      </Card>
    );
  }

  const colunasBaixas = [
    { key: "dataBaixa", label: "Data", render: (row) => formatarData(row.dataBaixa) },
    { key: "valorBaixado", label: "Valor", render: (row) => formatarMoeda(row.valorBaixado) },
    { key: "formaBaixa", label: "Forma", render: (row) => FORMA_BAIXA_LABEL[row.formaBaixa] ?? row.formaBaixa },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div>
          <h1>{titulo.participante.razaoSocial}</h1>
          <p>
            {titulo.tipo === "PAGAR" ? "A pagar" : "A receber"} — Número {titulo.numero} — Vencimento{" "}
            {formatarData(titulo.vencimento)} — {formatarMoeda(titulo.valor)}
          </p>
        </div>
        <StatusTituloBadge status={titulo.status} />
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <h3>Baixas registradas</h3>
        <DataTable columns={colunasBaixas} rows={titulo.baixas} emptyMessage="Nenhuma baixa registrada." />
      </Card>

      {titulo.status === "ABERTO" && (
        <Card style={{ marginBottom: "24px", maxWidth: "480px" }}>
          <h3>Registrar baixa</h3>
          <form onSubmit={handleBaixar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input
              label="Valor baixado"
              type="number"
              min="0"
              step="0.01"
              required
              value={valorBaixado}
              onChange={(e) => setValorBaixado(e.target.value)}
            />
            <Select label="Forma de baixa" required value={formaBaixa} onChange={(e) => setFormaBaixa(e.target.value)}>
              <option value="">Selecione...</option>
              {Object.entries(FORMA_BAIXA_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
            <Button type="submit" loading={salvandoBaixa} style={{ alignSelf: "flex-start" }}>
              Confirmar baixa
            </Button>
          </form>
        </Card>
      )}

      {titulo.status === "ABERTO" && titulo.baixas.length === 0 && (
        <Button variant="danger" onClick={() => setConfirmarCancelamento(true)}>
          Cancelar título
        </Button>
      )}

      <Modal
        open={confirmarCancelamento}
        onClose={() => setConfirmarCancelamento(false)}
        title="Cancelar este título?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarCancelamento(false)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleCancelar} loading={cancelando}>
              Sim, cancelar
            </Button>
          </>
        }
      >
        Essa ação não pode ser desfeita.
      </Modal>
    </div>
  );
}
