import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { Select } from "../../../components/ui/Select.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useRealtimeInvalidate } from "../../../hooks/useRealtimeInvalidate.js";
import { assinaturaApi } from "./api.js";

const PAPEIS_COM_ACESSO = ["ADMIN", "GESTOR"];

const STATUS_TONE = {
  ATIVA: "success",
  AGUARDANDO_PAGAMENTO: "accent",
  INADIMPLENTE: "danger",
  SUSPENSA: "danger",
};

const STATUS_LABEL = {
  ATIVA: "Em dia",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  INADIMPLENTE: "Em atraso",
  SUSPENSA: "Suspensa",
};

const TIPO_LABEL = { PRINCIPAL: "Principal", EXTRA: "Interno" };
const PONTO_STATUS_LABEL = {
  ATIVO: "Ativo",
  CANCELAMENTO_AGENDADO: "Cancelamento agendado",
  ENCERRADO: "Encerrado",
};

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor));
}

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
}

export function AssinaturaPage() {
  const toast = useToast();
  const { me } = useAuth();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [comprando, setComprando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [novoAcesso, setNovoAcesso] = useState({ nome: "", email: "", senha: "", role: "FUNCIONARIO" });
  const [cancelandoId, setCancelandoId] = useState(null);

  const temAcesso = PAPEIS_COM_ACESSO.includes(me?.role);
  const podeGerenciar = me?.role === "ADMIN";

  function carregar() {
    return assinaturaApi
      .obterDashboard()
      .then(setDados)
      .catch((err) => toast.error(err.message ?? "Não foi possível carregar a assinatura."));
  }

  useEffect(() => {
    if (!temAcesso) {
      setCarregando(false);
      return;
    }
    carregar().finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temAcesso]);

  useRealtimeInvalidate("/sistema/assinatura", carregar);

  async function comprarAcesso(event) {
    event.preventDefault();
    setComprando(true);
    try {
      const resultado = await assinaturaApi.comprarAcesso(novoAcesso);
      setDados(resultado);
      setModalAberto(false);
      setNovoAcesso({ nome: "", email: "", senha: "", role: "FUNCIONARIO" });
      toast.success("Acesso interno criado — as novas credenciais já podem ser usadas.");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível criar o novo acesso.");
    } finally {
      setComprando(false);
    }
  }

  async function cancelarPonto(ponto) {
    setCancelandoId(ponto.id);
    try {
      const resultado = await assinaturaApi.cancelarPonto(ponto.id);
      setDados(resultado);
      toast.success("Cancelamento agendado — a conta continua ativa até o fim do ciclo já pago.");
    } catch (err) {
      toast.error(err.message ?? "Não foi possível cancelar este ponto.");
    } finally {
      setCancelandoId(null);
    }
  }

  if (!temAcesso) {
    return (
      <Card>
        <h3>Acesso restrito</h3>
        <p>Só administradores e gestores podem ver a assinatura da empresa.</p>
      </Card>
    );
  }

  if (carregando || !dados) {
    return <Card>Carregando...</Card>;
  }

  if (dados.semAssinatura) {
    return (
      <Card>
        <h3>Sem assinatura ativa</h3>
        <p>Esta empresa ainda não tem uma assinatura cadastrada no KAV DECK — fale com o suporte pra regularizar.</p>
      </Card>
    );
  }

  const colunasPontos = [
    { key: "usuario", label: "Usuário", render: (row) => row.usuario?.nome ?? "Não vinculado" },
    { key: "email", label: "E-mail", render: (row) => row.usuario?.email ?? "—" },
    {
      key: "papel",
      label: "Perfil",
      render: (row) => row.usuario?.role === "ADMIN" ? "Administrador" : row.usuario ? "Funcionário" : "—",
    },
    { key: "tipo", label: "Tipo", render: (row) => TIPO_LABEL[row.tipo] ?? row.tipo },
    { key: "valorMensal", label: "Valor/mês", render: (row) => formatarMoeda(row.valorMensal) },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge tone={row.status === "ATIVO" ? "success" : "neutral"}>
          {PONTO_STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      ),
    },
    { key: "dataFimVigencia", label: "Sai do ar em", render: (row) => formatarData(row.dataFimVigencia) },
    ...(podeGerenciar
      ? [
          {
            key: "_acoes",
            label: "",
            render: (row) =>
              row.tipo === "EXTRA" && row.status === "ATIVO" ? (
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancelandoId === row.id}
                  disabled={Boolean(cancelandoId)}
                  onClick={() => cancelarPonto(row)}
                >
                  Cancelar
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1>Assinatura</h1>
        <p>Contas internas vinculadas à empresa, cada uma com seu próprio e-mail, senha e perfil.</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Acessos contratados</p>
          <h2 style={{ margin: "4px 0 0" }}>{dados.pontosContratados}</h2>
        </Card>
        <Card>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Usuários conectados</p>
          <h2 style={{ margin: "4px 0 0" }}>{dados.conectadosAgora}</h2>
        </Card>
        <Card>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Próxima cobrança</p>
          <h2 style={{ margin: "4px 0 0" }}>{formatarMoeda(dados.valorProximaCobranca)}</h2>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            em {formatarData(dados.proximaCobranca)}
          </p>
        </Card>
        <Card>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Status</p>
          <h2 style={{ margin: "4px 0 0" }}>
            <Badge tone={STATUS_TONE[dados.status] ?? "neutral"}>{STATUS_LABEL[dados.status] ?? dados.status}</Badge>
          </h2>
          {dados.diasEmAtraso > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
              {dados.diasEmAtraso} dia(s) em atraso
            </p>
          )}
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>Acessos internos</h3>
          {podeGerenciar && (
            <Button onClick={() => setModalAberto(true)} disabled={dados.status !== "ATIVA"}>
              Criar acesso (+R$ 150,00/mês)
            </Button>
          )}
        </div>
        <DataTable columns={colunasPontos} rows={dados.pontos} emptyMessage="Nenhum acesso encontrado." />
      </Card>

      <Modal
        open={modalAberto}
        onClose={() => !comprando && setModalAberto(false)}
        title="Criar acesso interno"
        footer={(
          <>
            <Button variant="secondary" disabled={comprando} onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button type="submit" form="form-novo-acesso" loading={comprando}>Criar e contratar</Button>
          </>
        )}
      >
        <form id="form-novo-acesso" onSubmit={comprarAcesso} style={{ display: "grid", gap: "14px" }}>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            A conta ficará vinculada a esta empresa e terá uma sessão própria por dispositivo.
          </p>
          <Input label="Nome" required value={novoAcesso.nome} onChange={(e) => setNovoAcesso((v) => ({ ...v, nome: e.target.value }))} />
          <Input label="E-mail de acesso" type="email" required value={novoAcesso.email} onChange={(e) => setNovoAcesso((v) => ({ ...v, email: e.target.value }))} />
          <Input label="Senha inicial" type="password" required minLength={8} hint="Mínimo de 8 caracteres." value={novoAcesso.senha} onChange={(e) => setNovoAcesso((v) => ({ ...v, senha: e.target.value }))} />
          <Select label="Perfil" value={novoAcesso.role} onChange={(e) => setNovoAcesso((v) => ({ ...v, role: e.target.value }))}>
            <option value="FUNCIONARIO">Funcionário</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
