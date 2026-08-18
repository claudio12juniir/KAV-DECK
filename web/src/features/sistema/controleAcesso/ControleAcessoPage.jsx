import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { controleAcessoApi, sessoesApi } from "./api.js";

const PAPEIS_COM_ACESSO = ["ADMIN", "GESTOR"];

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

function EfetivaBadge({ acao }) {
  if (acao.override !== null) {
    return (
      <Badge tone={acao.override ? "success" : "danger"}>
        {acao.override ? "Liberada (manual)" : "Bloqueada (manual)"}
      </Badge>
    );
  }
  return (
    <Badge tone={acao.permitidaPorPapel ? "accent" : "neutral"}>
      {acao.permitidaPorPapel ? "Liberada pelo papel" : "Bloqueada pelo papel"}
    </Badge>
  );
}

export function ControleAcessoPage() {
  const toast = useToast();
  const { me } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [carregandoSessoes, setCarregandoSessoes] = useState(true);
  const [revogandoUsuarioId, setRevogandoUsuarioId] = useState(null);

  const temAcesso = PAPEIS_COM_ACESSO.includes(me?.role);

  function carregarUsuarios() {
    return controleAcessoApi
      .listarUsuarios()
      .then(({ items }) => setUsuarios(items))
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar os usuários."));
  }

  function carregarSessoes() {
    return sessoesApi
      .listar()
      .then(({ items }) => setSessoes(items))
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar as sessões ativas."));
  }

  useEffect(() => {
    if (!temAcesso) {
      setCarregandoUsuarios(false);
      setCarregandoSessoes(false);
      return;
    }
    carregarUsuarios().finally(() => setCarregandoUsuarios(false));
    carregarSessoes().finally(() => setCarregandoSessoes(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temAcesso]);

  useRealtimeInvalidate("/sistema/controle-acesso", () => {
    carregarUsuarios();
    if (usuarioSelecionado) selecionar(usuarioSelecionado);
  });

  // Sessão ativa muda tanto por revogação (POST /sistema/sessoes/:id) quanto
  // por um login novo em outro dispositivo (POST /me/sessao) — assina os
  // dois pra este painel não ficar defasado em nenhum dos dois casos.
  useRealtimeInvalidate("/sistema/sessoes", carregarSessoes);
  useRealtimeInvalidate("/me/sessao", carregarSessoes);

  async function encerrarSessao(usuario) {
    setRevogandoUsuarioId(usuario.usuarioId);
    try {
      await sessoesApi.revogar(usuario.usuarioId);
      toast.success(`Sessão de ${usuario.usuario.nome} encerrada.`);
      await carregarSessoes();
    } catch (err) {
      toast.error(err.message ?? "Não foi possível encerrar essa sessão.");
    } finally {
      setRevogandoUsuarioId(null);
    }
  }

  async function selecionar(usuario) {
    setUsuarioSelecionado(usuario);
    setCarregandoDetalhe(true);
    try {
      const dados = await controleAcessoApi.obterPermissoes(usuario.id);
      setDetalhe(dados);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível carregar as permissões deste usuário.");
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  async function aplicar(acao, permitida) {
    const chave = `${acao.modulo}.${acao.acao}`;
    setAcaoEmAndamento(chave);
    try {
      await controleAcessoApi.definirPermissao(usuarioSelecionado.id, {
        modulo: acao.modulo,
        acao: acao.acao,
        permitida,
      });
      toast.success(permitida ? "Ação liberada para este usuário." : "Ação bloqueada para este usuário.");
      await selecionar(usuarioSelecionado);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível salvar essa permissão.");
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  async function voltarAoPadrao(acao) {
    const chave = `${acao.modulo}.${acao.acao}`;
    setAcaoEmAndamento(chave);
    try {
      await controleAcessoApi.removerOverride(usuarioSelecionado.id, acao.modulo, acao.acao);
      toast.success("Voltou a valer o papel padrão para esta ação.");
      await selecionar(usuarioSelecionado);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível reverter essa permissão.");
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  if (!temAcesso) {
    return (
      <Card>
        <h3>Acesso restrito</h3>
        <p>Só administradores e gestores podem gerenciar o controle de acesso.</p>
      </Card>
    );
  }

  const colunasUsuarios = [
    { key: "nome", label: "Nome" },
    { key: "email", label: "E-mail" },
    { key: "role", label: "Papel" },
    {
      key: "ativo",
      label: "Status",
      render: (row) => <Badge tone={row.ativo ? "success" : "neutral"}>{row.ativo ? "Ativo" : "Inativo"}</Badge>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1>Controle de Acesso</h1>
        <p>Libere ou bloqueie uma ação específica para um usuário, sem depender só do papel dele.</p>
      </div>

      <Card style={{ marginBottom: "24px" }}>
        <h3>Usuários</h3>
        <DataTable
          columns={colunasUsuarios}
          rows={usuarios}
          loading={carregandoUsuarios}
          onRowClick={selecionar}
          emptyMessage="Nenhum usuário encontrado."
        />
      </Card>

      <Card style={{ marginBottom: "24px" }}>
        <h3>Sessões ativas</h3>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "16px" }}>
          Cada usuário só pode estar logado em um dispositivo por vez — entrar em outro encerra
          automaticamente o anterior. Use "Encerrar sessão" para forçar o logout de alguém sem
          esperar isso acontecer.
        </p>
        <DataTable
          columns={[
            { key: "usuario", label: "Usuário", render: (row) => `${row.usuario.nome} (${row.usuario.email})` },
            { key: "dispositivo", label: "Dispositivo", render: (row) => row.dispositivo ?? "—" },
            { key: "criadaEm", label: "Desde", render: (row) => formatarDataHora(row.criadaEm) },
            { key: "ultimoAcessoEm", label: "Último acesso", render: (row) => formatarDataHora(row.ultimoAcessoEm) },
            {
              key: "_acoes",
              label: "",
              render: (row) => (
                <Button
                  variant="danger"
                  size="sm"
                  loading={revogandoUsuarioId === row.usuarioId}
                  disabled={Boolean(revogandoUsuarioId)}
                  onClick={() => encerrarSessao(row)}
                >
                  Encerrar sessão
                </Button>
              ),
            },
          ]}
          rows={sessoes}
          loading={carregandoSessoes}
          emptyMessage="Nenhuma sessão ativa no momento."
        />
      </Card>

      {usuarioSelecionado && (
        <Card>
          <h3>
            Permissões de {usuarioSelecionado.nome} <Badge tone="accent">{usuarioSelecionado.role}</Badge>
          </h3>
          <p style={{ color: "var(--color-text-muted)" }}>
            Sem um ajuste manual abaixo, vale o papel padrão de cada ação.
          </p>

          {carregandoDetalhe ? (
            <SkeletonLines count={4} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {detalhe?.acoes.map((acao) => {
                const chave = `${acao.modulo}.${acao.acao}`;
                const emAndamento = acaoEmAndamento === chave;
                return (
                  <div
                    key={chave}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div>
                      <strong>{acao.label}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                        {acao.descricao} — papel padrão: {acao.papeisPadrao.join(", ")}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <EfetivaBadge acao={acao} />
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={emAndamento}
                        disabled={acao.override === true}
                        onClick={() => aplicar(acao, true)}
                      >
                        Permitir
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={emAndamento}
                        disabled={acao.override === false}
                        onClick={() => aplicar(acao, false)}
                      >
                        Bloquear
                      </Button>
                      {acao.override !== null && (
                        <Button variant="ghost" size="sm" loading={emAndamento} onClick={() => voltarAoPadrao(acao)}>
                          Usar padrão
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
