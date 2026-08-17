import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { SkeletonLines } from "../../../components/ui/Skeleton.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { controleAcessoApi } from "./api.js";

const PAPEIS_COM_ACESSO = ["ADMIN", "GESTOR"];

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

  const temAcesso = PAPEIS_COM_ACESSO.includes(me?.role);

  useEffect(() => {
    if (!temAcesso) {
      setCarregandoUsuarios(false);
      return;
    }
    controleAcessoApi
      .listarUsuarios()
      .then(({ items }) => setUsuarios(items))
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar os usuários."))
      .finally(() => setCarregandoUsuarios(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temAcesso]);

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
