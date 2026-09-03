import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { DataTable } from "../../../components/ui/Table.jsx";
import { useToast } from "../../../components/ui/Toast.jsx";
import { createDevolucao, getPedidoVenda, listDevolucoes } from "../api.js";
import { PedidoVendaSelect } from "../components/PedidoVendaSelect.jsx";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function DevolucoesPage() {
  const toast = useToast();
  const [devolucoes, setDevolucoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [pedidoId, setPedidoId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [quantidades, setQuantidades] = useState({});
  const [motivo, setMotivo] = useState("");
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listDevolucoes({ pageSize: 50 })
      .then(({ items }) => ativo && setDevolucoes(items))
      .catch((err) => ativo && toast.error(err.message ?? "Não foi possível carregar as devoluções."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

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
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar a devolução.");
    } finally {
      setRegistrando(false);
    }
  }

  const columns = [
    { key: "pedido", label: "Pedido", render: (row) => row.pedidoVendaId.slice(0, 8) },
    { key: "motivo", label: "Motivo" },
    { key: "data", label: "Data", render: (row) => formatarData(row.data) },
    {
      key: "itens",
      label: "Itens devolvidos",
      render: (row) => row.itens.map((item) => `${item.produto.descricao} (${item.quantidade})`).join(", "),
    },
  ];

  return (
    <div>
      <h1>Devolução de vendas</h1>
      <p>Devolva itens de um pedido já faturado — o estoque volta automaticamente para um lote novo.</p>

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

      <h3>Devoluções registradas</h3>
      <DataTable columns={columns} rows={devolucoes} loading={carregando} emptyMessage="Nenhuma devolução registrada." />
    </div>
  );
}
