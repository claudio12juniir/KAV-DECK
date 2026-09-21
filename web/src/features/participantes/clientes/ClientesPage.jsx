import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { HistoricoModal, UltimaEdicaoCelula, useUltimasEdicoes } from "../../../components/audit/Historico.jsx";
import { logsApi } from "../../cadastros/logs/api.js";
import { PARTICIPANTE_FIELD_LABELS } from "../participantes/fieldLabels.js";
import { atualizarBloqueio, listClientes } from "./api.js";

export function ClientesPage() {
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState(null);
  const [verLogsDe, setVerLogsDe] = useState(null);
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const { items } = await listClientes();
      setClientes(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeInvalidate("/participantes/clientes", carregar);

  const idsParticipantes = useMemo(() => clientes.map((c) => c.participanteId), [clientes]);
  const { mapa: ultimasEdicoes, carregando: carregandoUltimas } = useUltimasEdicoes("participante", idsParticipantes);

  async function abrirLogs(participanteId) {
    setVerLogsDe(participanteId);
    setCarregandoLogs(true);
    try {
      const { items } = await logsApi.list("participante", participanteId);
      setLogs(items);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoLogs(false);
    }
  }

  async function alternarBloqueio(cliente) {
    const novoStatus = cliente.bloqueioFinanceiro === "BLOQUEADO" ? "LIBERADO" : "BLOQUEADO";
    setAtualizandoId(cliente.participanteId);
    try {
      await atualizarBloqueio(cliente.participanteId, novoStatus);
      toast.success(novoStatus === "BLOQUEADO" ? "Cliente bloqueado." : "Cliente liberado.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o bloqueio.");
    } finally {
      setAtualizandoId(null);
    }
  }

  const columns = [
    { key: "nome", label: "Nome", render: (row) => row.participante.razaoSocial },
    { key: "cpfCnpj", label: "CPF/CNPJ", render: (row) => row.participante.cpfCnpj },
    {
      key: "bloqueioFinanceiro",
      label: "Situação financeira",
      render: (row) => (
        <Badge tone={row.bloqueioFinanceiro === "BLOQUEADO" ? "danger" : "success"}>
          {row.bloqueioFinanceiro === "BLOQUEADO" ? "Bloqueado" : "Liberado"}
        </Badge>
      ),
    },
    {
      key: "_ultimaEdicao",
      label: "Última edição",
      render: (row) => (
        <UltimaEdicaoCelula
          info={ultimasEdicoes[row.participanteId]}
          carregando={carregandoUltimas && ultimasEdicoes[row.participanteId] === undefined}
          onClick={() => abrirLogs(row.participanteId)}
        />
      ),
    },
    {
      key: "_acao",
      label: "",
      render: (row) => (
        <Button
          variant={row.bloqueioFinanceiro === "BLOQUEADO" ? "secondary" : "danger"}
          loading={atualizandoId === row.participanteId}
          disabled={Boolean(atualizandoId)}
          onClick={() => alternarBloqueio(row)}
        >
          {row.bloqueioFinanceiro === "BLOQUEADO" ? "Liberar" : "Bloquear"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1>Clientes</h1>
      <p>Situação de bloqueio financeiro — cliente bloqueado não pode gerar novo pedido de venda.</p>

      <DataTable
        columns={columns}
        rows={clientes}
        loading={carregando}
        emptyMessage="Nenhum cliente encontrado. Promova um participante a cliente na tela de Participantes."
      />

      <HistoricoModal
        open={Boolean(verLogsDe)}
        onClose={() => setVerLogsDe(null)}
        logs={logs}
        loading={carregandoLogs}
        fieldLabels={PARTICIPANTE_FIELD_LABELS}
      />
    </div>
  );
}
