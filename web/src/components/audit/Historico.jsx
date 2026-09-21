import { useEffect, useState } from "react";
import { Badge } from "../ui/Badge.jsx";
import { Modal } from "../ui/Modal.jsx";
import { logsApi } from "../../features/cadastros/logs/api.js";
import "./Historico.css";

const ACAO_LABEL = { CRIACAO: "Criação", ATUALIZACAO: "Atualização", EXCLUSAO: "Exclusão" };
const ACAO_TONE = { CRIACAO: "success", ATUALIZACAO: "accent", EXCLUSAO: "danger" };

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Datas/datetimes chegam do backend como string ISO (normalizarValor em
// auditLog.js já converte Date -> ISO antes de gravar) — detecta pelo
// formato pra não mostrar "2026-08-21T00:00:00.000Z" cru pro usuário.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function formatarValor(valor) {
  if (valor === null || valor === undefined || valor === "") return <span className="historico-valor-vazio">vazio</span>;
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "string" && ISO_DATE_RE.test(valor)) return formatarDataHora(valor);
  return String(valor);
}

function rotuloCampo(campo, fieldLabels) {
  return fieldLabels?.[campo] ?? campo;
}

export function AcaoLogBadge({ acao }) {
  return <Badge tone={ACAO_TONE[acao] ?? "neutral"}>{ACAO_LABEL[acao] ?? acao}</Badge>;
}

// Célula compacta pra coluna "Última edição" da grade — uma linha só,
// sem abrir modal nenhum. `info` vem do endpoint em lote (ultimas), pode
// ser undefined enquanto carrega ou null se o registro nunca teve log.
export function UltimaEdicaoCelula({ info, carregando, onClick }) {
  if (carregando) return <span className="historico-celula-vazia">…</span>;
  if (!info) return <span className="historico-celula-vazia">—</span>;
  return (
    <button type="button" className="historico-celula" onClick={onClick}>
      <AcaoLogBadge acao={info.acao} />
      <span className="historico-celula-texto">
        {info.usuario?.nome ?? "—"}
        <span className="historico-celula-data">{formatarDataHora(info.criadoEm)}</span>
      </span>
    </button>
  );
}

// Timeline completa (modal). Cada log já vem com `dados` no formato novo
// ({ depois } | { alteracoes } | { antes }) gravado por auditarCriacao /
// auditarAtualizacao / auditarExclusao em src/lib/auditLog.js — logs antigos
// (formato snapshot cru, anteriores a essa mudança) ainda são exibidos, só
// sem o detalhe campo-a-campo.
export function HistoricoModal({ open, onClose, logs, loading, fieldLabels }) {
  return (
    <Modal open={open} onClose={onClose} title="Histórico de alterações">
      {loading ? (
        <p className="historico-vazio">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="historico-vazio">Nenhum registro de alteração encontrado.</p>
      ) : (
        <ol className="historico-timeline">
          {logs.map((log) => {
            const alteracoes = log.dados?.alteracoes;
            const campos = alteracoes ? Object.entries(alteracoes) : [];
            return (
              <li key={log.id} className="historico-item">
                <div className="historico-item-marcador" />
                <div className="historico-item-corpo">
                  <div className="historico-item-cabecalho">
                    <AcaoLogBadge acao={log.acao} />
                    <span className="historico-item-autor">{log.usuario?.nome ?? "Sistema"}</span>
                    <span className="historico-item-data">{formatarDataHora(log.criadoEm)}</span>
                  </div>
                  {campos.length > 0 && (
                    <ul className="historico-campos">
                      {campos.map(([campo, { de, para }]) => (
                        <li key={campo} className="historico-campo">
                          <span className="historico-campo-nome">{rotuloCampo(campo, fieldLabels)}</span>
                          <span className="historico-campo-diff">
                            <span className="historico-campo-de">{formatarValor(de)}</span>
                            <span className="historico-campo-seta">→</span>
                            <span className="historico-campo-para">{formatarValor(para)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}

// Busca em lote a última edição de cada item de uma lista (1 request pra
// grade inteira, não 1 por linha) — usado pela coluna "Última edição".
// Reconsulta sempre que a lista de ids muda (ex.: paginação, busca).
export function useUltimasEdicoes(entidade, ids) {
  const [mapa, setMapa] = useState({});
  const [carregando, setCarregando] = useState(false);
  const chaveIds = ids.join(",");

  useEffect(() => {
    if (!entidade || ids.length === 0) {
      setMapa({});
      return undefined;
    }
    let cancelado = false;
    setCarregando(true);
    logsApi
      .ultimas(entidade, ids)
      .then((res) => {
        if (!cancelado) setMapa(res ?? {});
      })
      .catch(() => {
        if (!cancelado) setMapa({});
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidade, chaveIds]);

  return { mapa, carregando };
}
