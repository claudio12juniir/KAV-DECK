import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { SkeletonLines } from "../../components/ui/Skeleton.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { getPedidoCompra, receberPedidoCompra } from "./api.js";

export function RecebimentoPedidoCompraPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [itens, setItens] = useState([]);
  const [sif, setSif] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    getPedidoCompra(id)
      .then((pedido) => {
        if (!ativo) return;
        setFornecedorNome(pedido.fornecedor.participante.razaoSocial);
        setItens(
          pedido.itens.map((item) => ({
            produtoId: item.produtoId,
            codigo: item.produto.codigo,
            descricao: item.produto.descricao,
            quantidadePedida: item.quantidade,
            quantidade: item.quantidade,
            dataValidade: "",
          })),
        );
      })
      .catch((err) => {
        if (ativo) setErroCarregar(err.message ?? "Não foi possível carregar este pedido.");
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function alterarItem(index, campo, valor) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  const podeSalvar = itens.length > 0 && itens.every((item) => Number(item.quantidade) > 0) && !salvando;

  async function handleSalvar() {
    setSalvando(true);
    try {
      await receberPedidoCompra(
        id,
        itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: String(item.quantidade),
          ...(item.dataValidade ? { dataValidade: item.dataValidade } : {}),
          ...(sif ? { sif } : {}),
          ...(temperatura ? { temperaturaRecebimento: String(temperatura) } : {}),
          ...(veiculo ? { veiculo } : {}),
        })),
      );
      toast.success("Recebimento registrado com sucesso.");
      navigate(`/compras/${id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível registrar o recebimento.");
    } finally {
      setSalvando(false);
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

  return (
    <div>
      <h1>Receber mercadoria</h1>
      <p>Pedido de {fornecedorNome}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "760px" }}>
        <Card>
          <h3>Informações do recebimento</h3>
          <p style={{ marginBottom: "24px" }}>
            Preenchidas uma vez e aplicadas a todos os itens desta entrega.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
            <Input label="SIF (opcional)" value={sif} onChange={(e) => setSif(e.target.value)} />
            <Input
              label="Temperatura (°C, opcional)"
              type="number"
              step="0.1"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
            />
            <Input label="Veículo (opcional)" value={veiculo} onChange={(e) => setVeiculo(e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3>Itens</h3>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd. pedida</th>
                  <th>Qtd. recebida</th>
                  <th>Validade</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, index) => (
                  <tr key={item.produtoId}>
                    <td data-label="Produto">
                      <strong>{item.descricao}</strong>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{item.codigo}</div>
                    </td>
                    <td data-label="Qtd. pedida">{item.quantidadePedida}</td>
                    <td data-label="Qtd. recebida">
                      <input
                        className="field-control"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantidade}
                        onChange={(e) => alterarItem(index, "quantidade", e.target.value)}
                      />
                    </td>
                    <td data-label="Validade">
                      <input
                        className="field-control"
                        type="date"
                        value={item.dataValidade}
                        onChange={(e) => alterarItem(index, "dataValidade", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Button onClick={handleSalvar} loading={salvando} disabled={!podeSalvar} style={{ alignSelf: "flex-start" }}>
          Confirmar recebimento
        </Button>
      </div>
    </div>
  );
}
