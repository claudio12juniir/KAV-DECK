import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { ProdutoAutocomplete } from "../../shared/ProdutoAutocomplete.jsx";
import { createOcorrencia, listOcorrencias, opcoesOcorrencia } from "../api.js";
import { ClienteAutocomplete } from "../components/ClienteAutocomplete.jsx";
import { PedidoVendaSelect } from "../components/PedidoVendaSelect.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

// Modal "Ocorrência" mais completo do SpaceSoft (seção 13 do mapeamento,
// reconfirmada ao vivo contra o sistema real — 2+ anos de histórico, zero
// ocorrências registradas por este cliente): além de Tipo/Motivo/Resolução,
// permite vincular itens específicos do pedido — habilita relatório futuro
// de "quais produtos mais geram ocorrência", não só "quais pedidos".
export function OcorrenciasPage() {
  const toast = useToast();
  const [dataInicial, setDataInicial] = useState(hoje());
  const [dataFinal, setDataFinal] = useState(hoje());
  const [clienteFiltro, setClienteFiltro] = useState(null);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [opcoes, setOpcoes] = useState({ tipos: [], resolucoes: [] });
  const [mostrarNovo, setMostrarNovo] = useState(false);

  const [pedidoId, setPedidoId] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [tipo, setTipo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [resolucao, setResolucao] = useState("");
  const [data, setData] = useState(hoje());
  const [itens, setItens] = useState([]);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    opcoesOcorrencia().then(setOpcoes).catch(() => {});
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listOcorrencias({
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
      clienteId: clienteFiltro?.participanteId || undefined,
      pageSize: 200,
    })
      .then(({ items }) => ativo && setOcorrencias(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar as ocorrências."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicial, dataFinal, clienteFiltro, refreshKey]);

  const valorTotalItens = itens.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  const podeRegistrar = tipo.trim().length > 0 && motivo.trim().length >= 3 && !registrando;

  function adicionarItem(produto) {
    setItens((atual) => [...atual, { produtoId: produto.id, codigo: produto.codigo, descricao: produto.descricao, quantidade: "1", valor: "0" }]);
  }

  function alterarItem(index, campo, valor) {
    setItens((atual) => atual.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function removerItem(index) {
    setItens((atual) => atual.filter((_, i) => i !== index));
  }

  async function handleRegistrar() {
    setRegistrando(true);
    try {
      await createOcorrencia({
        pedidoVendaId: pedidoId || undefined,
        clienteId: cliente?.participanteId || undefined,
        tipo: tipo.trim(),
        motivo: motivo.trim(),
        resolucao: resolucao.trim() || undefined,
        data: data || undefined,
        itens: itens.length
          ? itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade, valor: item.valor }))
          : undefined,
      });
      toast.success("Ocorrência registrada com sucesso.");
      setPedidoId(null);
      setCliente(null);
      setTipo("");
      setMotivo("");
      setResolucao("");
      setData(hoje());
      setItens([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar a ocorrência.");
    } finally {
      setRegistrando(false);
    }
  }

  const columns = [
    { key: "_indice", label: "#", render: (_row, index) => index + 1 },
    { key: "data", label: "Data oc.", render: (row) => formatarData(row.data) },
    {
      key: "pedido",
      label: "Pedido",
      render: (row) => (row.pedidoVendaId ? <Link to={`/vendas/${row.pedidoVendaId}`}>{row.pedidoVendaId.slice(0, 8)}</Link> : "—"),
    },
    { key: "cliente", label: "Cliente", render: (row) => row.cliente?.participante.razaoSocial ?? "—" },
    { key: "tipo", label: "Tipo" },
    { key: "motivo", label: "Motivo" },
    { key: "resolucao", label: "Resolução", render: (row) => row.resolucao ?? "—" },
    { key: "itens", label: "Itens", render: (row) => (row.itens?.length ? `${row.itens.length} produto(s)` : "—") },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1>Ocorrência</h1>
          <p>Registre problemas ou exceções ligados a um pedido de venda ou cliente (ex.: avaria, atraso, divergência).</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="ghost" onClick={() => toast.error("Impressão ainda não implementada nesta versão do KAV DECK.")}>
            Imprimir
          </Button>
          <Button onClick={() => setMostrarNovo((v) => !v)}>{mostrarNovo ? "Cancelar" : "+ Adicionar"}</Button>
        </div>
      </div>

      {mostrarNovo && (
      <Card style={{ marginBottom: "24px", maxWidth: "680px" }}>
        <h3>Nova ocorrência</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PedidoVendaSelect label="Pedido de venda (opcional)" value={pedidoId} onChange={setPedidoId} />
          <ClienteAutocomplete
            selecionado={cliente}
            onSelecionar={setCliente}
            onLimpar={() => setCliente(null)}
            permitirSemCadastro={false}
          />
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <Input
                label="Tipo"
                list="ocorrencia-tipos"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex.: Avaria, Atraso, Divergência..."
              />
              <datalist id="ocorrencia-tipos">
                {opcoes.tipos.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <Input
                label="Resolução (opcional)"
                list="ocorrencia-resolucoes"
                value={resolucao}
                onChange={(e) => setResolucao(e.target.value)}
                placeholder="Qual foi a resolução?"
              />
              <datalist id="ocorrencia-resolucoes">
                {opcoes.resolucoes.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Motivo</label>
            <textarea className="field-control" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <Input label="Data da ocorrência" type="date" value={data} onChange={(e) => setData(e.target.value)} />

          <div>
            <label className="field-label">Itens da ocorrência (opcional)</label>
            <ProdutoAutocomplete onSelecionar={adicionarItem} label="Adicionar item" />
            {itens.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                {itens.map((item, index) => (
                  <div key={`${item.produtoId}-${index}`} style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "8px" }}>
                    <span style={{ flex: 1 }}>
                      {item.codigo} — {item.descricao}
                    </span>
                    <Input
                      label="Qtd."
                      type="number"
                      style={{ width: "90px" }}
                      value={item.quantidade}
                      onChange={(e) => alterarItem(index, "quantidade", e.target.value)}
                    />
                    <Input
                      label="Valor"
                      type="number"
                      style={{ width: "110px" }}
                      value={item.valor}
                      onChange={(e) => alterarItem(index, "valor", e.target.value)}
                    />
                    <Button variant="ghost" onClick={() => removerItem(index)}>
                      Remover
                    </Button>
                  </div>
                ))}
                <div style={{ textAlign: "right", fontWeight: 700 }}>Valor total: {formatarMoeda(valorTotalItens)}</div>
              </div>
            )}
          </div>

          <Button onClick={handleRegistrar} loading={registrando} disabled={!podeRegistrar} style={{ alignSelf: "flex-start" }}>
            Registrar ocorrência
          </Button>
        </div>
      </Card>
      )}

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
          <ClienteAutocomplete
            selecionado={clienteFiltro}
            onSelecionar={setClienteFiltro}
            onLimpar={() => setClienteFiltro(null)}
            permitirSemCadastro={false}
          />
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <strong>Ocorrências ({ocorrencias.length ? 1 : 0} - {ocorrencias.length})</strong>
        <button type="button" className="icon-btn" title="Atualizar" onClick={() => setRefreshKey((k) => k + 1)}>
          <FiRefreshCw />
        </button>
      </div>

      <DataTable columns={columns} rows={ocorrencias} loading={carregando} emptyMessage="Nenhuma ocorrência registrada para este filtro." />
    </div>
  );
}
