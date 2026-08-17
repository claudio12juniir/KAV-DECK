import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { SkeletonLines } from "../../components/ui/Skeleton.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { listLotes } from "../estoque/api.js";
import { faturarPedidoVenda, getPedidoVenda } from "./api.js";

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "sem validade";
}

export function FaturarPedidoVendaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [itens, setItens] = useState([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const pedido = await getPedidoVenda(id);
        if (!ativo) return;
        setClienteNome(pedido.cliente.participante.razaoSocial);

        const itensComLotes = await Promise.all(
          pedido.itens.map(async (item) => {
            const { items: lotesDisponiveis } = await listLotes({ produtoId: item.produtoId, pageSize: 50 });
            const primeiroLote = lotesDisponiveis[0];
            return {
              produtoId: item.produtoId,
              codigo: item.produto.codigo,
              descricao: item.produto.descricao,
              quantidadePedida: item.quantidade,
              quantidade: item.quantidade,
              lotesDisponiveis,
              loteId: primeiroLote?.id ?? "",
            };
          }),
        );
        if (ativo) setItens(itensComLotes);
      } catch (err) {
        if (ativo) setErroCarregar(err.message ?? "Não foi possível carregar este pedido.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [id]);

  function alterarItem(index, campo, valor) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function loteSelecionado(item) {
    return item.lotesDisponiveis.find((lote) => lote.id === item.loteId);
  }

  const podeSalvar =
    itens.length > 0 &&
    !salvando &&
    itens.every((item) => {
      const lote = loteSelecionado(item);
      return lote && Number(item.quantidade) > 0 && Number(item.quantidade) <= Number(lote.quantidadeAtual);
    });

  async function handleSalvar() {
    setSalvando(true);
    try {
      await faturarPedidoVenda(
        id,
        itens.map((item) => ({
          produtoId: item.produtoId,
          loteId: item.loteId,
          quantidade: String(item.quantidade),
        })),
      );
      toast.success("Pedido faturado com sucesso.");
      navigate(`/vendas/${id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível faturar o pedido.");
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
      <h1>Faturar pedido</h1>
      <p>Pedido de {clienteNome} — escolha o lote de cada item.</p>

      <Card style={{ maxWidth: "900px" }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd. do pedido</th>
                <th>Lote</th>
                <th>Qtd. a baixar</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => {
                const lote = loteSelecionado(item);
                const excedeEstoque = lote && Number(item.quantidade) > Number(lote.quantidadeAtual);
                return (
                  <tr key={item.produtoId}>
                    <td data-label="Produto">
                      <strong>{item.descricao}</strong>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{item.codigo}</div>
                    </td>
                    <td data-label="Qtd. do pedido">{item.quantidadePedida}</td>
                    <td data-label="Lote">
                      {item.lotesDisponiveis.length === 0 ? (
                        <span style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
                          Sem lote disponível
                        </span>
                      ) : (
                        <select
                          className="field-control"
                          value={item.loteId}
                          onChange={(e) => alterarItem(index, "loteId", e.target.value)}
                        >
                          {item.lotesDisponiveis.map((l) => (
                            <option key={l.id} value={l.id}>
                              Validade: {formatarData(l.dataValidade)} — disponível: {l.quantidadeAtual}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td data-label="Qtd. a baixar">
                      <input
                        className="field-control"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantidade}
                        onChange={(e) => alterarItem(index, "quantidade", e.target.value)}
                      />
                      {excedeEstoque && (
                        <div style={{ color: "var(--color-danger)", fontSize: "var(--text-xs)", marginTop: "4px" }}>
                          Maior que o disponível no lote.
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Button onClick={handleSalvar} loading={salvando} disabled={!podeSalvar} style={{ marginTop: "24px" }}>
        Confirmar faturamento
      </Button>
    </div>
  );
}
