import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UltimaEdicaoCelula, useUltimasEdicoes } from "../../../components/audit/Historico.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { createDevolucao, getPedidoVenda, listDevolucoes } from "../api.js";
import { PedidoVendaSelect } from "../components/PedidoVendaSelect.jsx";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Tela de referência (Space Soft, ver MAPEAMENTO_VENDAS_SPACESOFT.md seção
// 8, reconfirmada ao vivo) filtra por Data Inicial/Final da emissão do
// pedido de origem, mostra "Valor das Devoluções" (soma do filtro atual) e
// abre o formulário de nova devolução atrás de um botão "+Novo" — testado
// contra o sistema real com mais de 2 anos de histórico e zero devoluções
// registradas por este cliente, então o fluxo de criação em si nunca pôde
// ser validado ao vivo lá.
//
// Gaps conhecidos (sem campo equivalente no schema do KAV DECK): coluna
// "DOC" (número sequencial próprio da devolução) não foi replicada; o
// toggle "Exibir Cancelados" está no layout (pedido explícito do usuário de
// copiar botão a botão), mas não filtra nada de verdade — não existe
// conceito de devolução cancelada em DevolucaoVenda hoje, precisaria de um
// campo de status novo.
export function DevolucoesPage() {
  const toast = useToast();
  const [dataInicial, setDataInicial] = useState(hoje());
  const [dataFinal, setDataFinal] = useState(hoje());
  const [exibirCancelados, setExibirCancelados] = useState(false);
  const [devolucoes, setDevolucoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mostrarNovo, setMostrarNovo] = useState(false);

  function stub(nomeRecurso) {
    return () => toast.error(`${nomeRecurso} ainda não implementado nesta versão do KAV DECK.`);
  }

  const [pedidoId, setPedidoId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [quantidades, setQuantidades] = useState({});
  const [motivo, setMotivo] = useState("");
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listDevolucoes({ dataInicial: dataInicial || undefined, dataFinal: dataFinal || undefined, pageSize: 200 })
      .then(({ items }) => ativo && setDevolucoes(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar as devoluções."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicial, dataFinal, refreshKey]);

  useEffect(() => {
    if (!pedidoId) {
      setPedido(null);
      setQuantidades({});
      return;
    }
    getPedidoVenda(pedidoId).then((p) => {
      setPedido(p);
      setQuantidades({});
    });
  }, [pedidoId]);

  function alterarQuantidade(produtoId, valor) {
    setQuantidades((prev) => ({ ...prev, [produtoId]: valor }));
  }

  const podeRegistrar =
    pedido && motivo.trim().length >= 3 && !registrando && Object.values(quantidades).some((q) => Number(q) > 0);

  async function handleRegistrar() {
    setRegistrando(true);
    try {
      const itens = pedido.itens
        .filter((item) => Number(quantidades[item.produtoId]) > 0)
        .map((item) => ({ produtoId: item.produtoId, quantidade: String(quantidades[item.produtoId]) }));
      await createDevolucao({ pedidoVendaId: pedido.id, motivo: motivo.trim(), itens });
      toast.success("Devolução registrada com sucesso.");
      setPedidoId(null);
      setMotivo("");
      setMostrarNovo(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar a devolução.");
    } finally {
      setRegistrando(false);
    }
  }

  const valorDasDevolucoes = devolucoes.reduce((soma, d) => soma + d.valorDevolucao, 0);

  const ids = useMemo(() => devolucoes.map((d) => d.id), [devolucoes]);
  const { mapa: ultimasEdicoes, carregando: carregandoUltimas } = useUltimasEdicoes("devolucao-venda", ids);

  const columns = [
    { key: "_indice", label: "#", render: (_row, index) => index + 1 },
    {
      key: "_registradoPor",
      label: "Registrado por",
      render: (row) => (
        <UltimaEdicaoCelula info={ultimasEdicoes[row.id]} carregando={carregandoUltimas && ultimasEdicoes[row.id] === undefined} />
      ),
    },
    { key: "dataDev", label: "Data da dev.", render: (row) => formatarData(row.data) },
    { key: "valorDev", label: "Valor da dev.", render: (row) => formatarMoeda(row.valorDevolucao) },
    { key: "numeroPed", label: "Número ped.", render: (row) => <Link to={`/vendas/${row.pedidoVendaId}`}>{row.pedidoVendaId.slice(0, 8)}</Link> },
    { key: "dataPed", label: "Data do ped.", render: (row) => formatarData(row.pedidoVenda.dataEmissao) },
    { key: "cliente", label: "Cliente", render: (row) => row.pedidoVenda.cliente.participante.razaoSocial },
    { key: "valorPed", label: "Valor do ped.", render: (row) => formatarMoeda(row.valorPedido) },
    { key: "motivo", label: "Motivo" },
    {
      key: "itens",
      label: "Itens devolvidos",
      render: (row) => row.itens.map((item) => `${item.produto.descricao} (${item.quantidade})`).join(", "),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1>Devolução de Venda</h1>
          <p>Devolva itens de um pedido já faturado — o estoque volta automaticamente para um lote novo.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button onClick={() => setMostrarNovo((v) => !v)}>{mostrarNovo ? "Cancelar" : "+ Novo"}</Button>
          <Button variant="ghost" onClick={stub("Impressão")}>
            Imprimir
          </Button>
          <Button variant="ghost" onClick={stub("Impressão (Cliente)")}>
            Imprimir (Cliente)
          </Button>
        </div>
      </div>

      {mostrarNovo && (
        <Card style={{ marginBottom: "24px", maxWidth: "760px" }}>
          <h3>Nova devolução</h3>
          <PedidoVendaSelect status="FATURADO" value={pedidoId} onChange={setPedidoId} />

          {pedido && (
            <>
              <div className="data-table-wrap" style={{ marginTop: "16px" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd. vendida</th>
                      <th>Qtd. a devolver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.itens.map((item) => (
                      <tr key={item.id}>
                        <td data-label="Produto">{item.produto.descricao}</td>
                        <td data-label="Qtd. vendida">{item.quantidade}</td>
                        <td data-label="Qtd. a devolver">
                          <input
                            className="field-control"
                            type="number"
                            min="0"
                            step="0.01"
                            value={quantidades[item.produtoId] ?? ""}
                            onChange={(e) => alterarQuantidade(item.produtoId, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="field" style={{ marginTop: "16px" }}>
                <label className="field-label">Motivo</label>
                <textarea className="field-control" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>

              <Button onClick={handleRegistrar} loading={registrando} disabled={!podeRegistrar} style={{ marginTop: "16px" }}>
                Registrar devolução
              </Button>
            </>
          )}
        </Card>
      )}

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <Input label="Data inicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
            <Input label="Data final" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" checked={exibirCancelados} onChange={(e) => setExibirCancelados(e.target.checked)} />
              Exibir Cancelados
            </label>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>Valor das devoluções</div>
            <div style={{ fontWeight: 700 }}>{formatarMoeda(valorDasDevolucoes)}</div>
          </div>
        </div>
      </Card>

      <DataTable columns={columns} rows={devolucoes} loading={carregando} emptyMessage="Nenhuma devolução registrada para este filtro." />
    </div>
  );
}
