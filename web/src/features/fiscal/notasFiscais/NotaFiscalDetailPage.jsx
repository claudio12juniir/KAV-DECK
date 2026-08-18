import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { addManifestacao, getNotaFiscal, updateNotaFiscalStatus } from "./api.js";
import { StatusNotaBadge } from "./StatusNotaBadge.jsx";

const TRANSICOES = {
  EM_DIGITACAO: ["EM_PROCESSAMENTO", "CANCELADO"],
  EM_PROCESSAMENTO: ["AUTORIZADO", "REJEICAO", "USO_DENEGADO"],
  AUTORIZADO: ["CANCELADO"],
  REJEICAO: ["EM_DIGITACAO"],
  USO_DENEGADO: [],
  CANCELADO: [],
  ARQUIVO_CRIADO: [],
};

const ROTULOS = {
  EM_PROCESSAMENTO: "Enviar para processamento",
  AUTORIZADO: "Autorizar",
  REJEICAO: "Rejeitar",
  USO_DENEGADO: "Denegar uso",
  CANCELADO: "Cancelar",
  EM_DIGITACAO: "Corrigir e voltar para digitação",
};

const MANIFESTACAO_LABEL = {
  CIENCIA: "Dar ciência",
  CONFIRMACAO: "Confirmar operação",
  DESCONHECIMENTO: "Desconhecer operação",
  NAO_REALIZADA: "Operação não realizada",
};

const EVENTOS_TERMINAIS = new Set(["CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]);

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function NotaFiscalDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [nota, setNota] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [transicaoEmAndamento, setTransicaoEmAndamento] = useState(null);
  const [modalAutorizar, setModalAutorizar] = useState(false);
  const [chaveAcesso, setChaveAcesso] = useState("");
  const [manifestandoTipo, setManifestandoTipo] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await getNotaFiscal(id);
      setNota(dados);
    } catch (err) {
      setErroCarregar(err.message ?? "Não foi possível carregar esta nota fiscal.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRealtimeInvalidate("/fiscal/notas", carregar);

  async function aplicarTransicao(status, chave) {
    setTransicaoEmAndamento(status);
    try {
      await updateNotaFiscalStatus(id, status, chave);
      toast.success("Status atualizado com sucesso.");
      setModalAutorizar(false);
      setChaveAcesso("");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível atualizar o status.");
    } finally {
      setTransicaoEmAndamento(null);
    }
  }

  async function handleManifestar(tipoEvento) {
    setManifestandoTipo(tipoEvento);
    try {
      await addManifestacao(id, tipoEvento);
      toast.success("Manifestação registrada.");
      await carregar();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar a manifestação.");
    } finally {
      setManifestandoTipo(null);
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

  const transicoesDisponiveis = TRANSICOES[nota.status] ?? [];
  const jaTemEventoTerminal = nota.manifestacoes.some((m) => EVENTOS_TERMINAIS.has(m.tipoEvento));

  const columns = [
    { key: "produto", label: "Produto", render: (row) => row.produto.descricao },
    { key: "quantidade", label: "Qtd." },
    { key: "valorUnitario", label: "Valor unit.", render: (row) => formatarMoeda(row.valorUnitario) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div>
          <h1>
            Nota {nota.serie}/{nota.numero}
          </h1>
          <p>{nota.participante.razaoSocial}</p>
        </div>
        <StatusNotaBadge status={nota.status} />
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <h3>Itens</h3>
        <DataTable columns={columns} rows={nota.itens} emptyMessage="Nota sem itens." />
      </Card>

      {transicoesDisponiveis.length > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
          {transicoesDisponiveis.map((status) => (
            <Button
              key={status}
              variant={status === "CANCELADO" || status === "USO_DENEGADO" || status === "REJEICAO" ? "danger" : "secondary"}
              loading={transicaoEmAndamento === status}
              disabled={Boolean(transicaoEmAndamento)}
              onClick={() => (status === "AUTORIZADO" ? setModalAutorizar(true) : aplicarTransicao(status))}
            >
              {ROTULOS[status]}
            </Button>
          ))}
        </div>
      )}

      {!jaTemEventoTerminal && (
        <Card>
          <h3>Manifestação do destinatário</h3>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {Object.entries(MANIFESTACAO_LABEL).map(([tipo, label]) => (
              <Button
                key={tipo}
                variant="secondary"
                loading={manifestandoTipo === tipo}
                disabled={Boolean(manifestandoTipo)}
                onClick={() => handleManifestar(tipo)}
              >
                {label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={modalAutorizar}
        onClose={() => setModalAutorizar(false)}
        title="Autorizar nota fiscal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAutorizar(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => aplicarTransicao("AUTORIZADO", chaveAcesso)}
              loading={transicaoEmAndamento === "AUTORIZADO"}
              disabled={chaveAcesso.length !== 44}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: "12px" }}>
          Informe a chave de acesso de 44 dígitos retornada pela autorização (a transmissão real à SEFAZ ainda não
          está integrada — este é um registro manual).
        </p>
        <Input
          label="Chave de acesso"
          value={chaveAcesso}
          maxLength={44}
          onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, ""))}
        />
      </Modal>
    </div>
  );
}
