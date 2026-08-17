import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { ProdutoAutocomplete } from "../shared/ProdutoAutocomplete.jsx";
import { createPedidoVenda } from "./api.js";
import { ClienteAutocomplete } from "./components/ClienteAutocomplete.jsx";
import { ItensPedidoTable } from "./components/ItensPedidoTable.jsx";

export function NovoPedidoVendaPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cliente, setCliente] = useState(null);
  const [itens, setItens] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const clienteBloqueado = cliente?.bloqueioFinanceiro === "BLOQUEADO";
  const podeSalvar = cliente && !clienteBloqueado && itens.length > 0 && !salvando;

  function adicionarProduto(produto) {
    setItens((prev) => [
      ...prev,
      {
        produtoId: produto.id,
        codigo: produto.codigo,
        descricao: produto.descricao,
        quantidade: 1,
        precoUnitario: produto.precoReferencia ?? 0,
        desconto: 0,
      },
    ]);
  }

  function alterarItem(index, campo, valor) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function removerItem(index) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      const pedido = await createPedidoVenda({
        clienteId: cliente.participanteId,
        itens: itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: String(item.quantidade),
          precoUnitario: String(item.precoUnitario),
          desconto: String(item.desconto || 0),
        })),
      });
      toast.success("Pedido de venda criado com sucesso.");
      navigate(`/vendas/${pedido.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível criar o pedido.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1>Novo pedido de venda</h1>
      <p>Busque o cliente, adicione os produtos e confirme.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "760px" }}>
        <Card>
          <h3>Cliente</h3>
          <ClienteAutocomplete selecionado={cliente} onSelecionar={setCliente} onLimpar={() => setCliente(null)} />
          {clienteBloqueado && (
            <p style={{ color: "var(--color-danger)", marginTop: "12px", marginBottom: 0 }}>
              Este cliente está com bloqueio financeiro ativo e não pode receber novos pedidos.
            </p>
          )}
        </Card>

        <Card>
          <h3>Itens</h3>
          <div style={{ marginBottom: "24px" }}>
            <ProdutoAutocomplete onSelecionar={adicionarProduto} />
          </div>
          <ItensPedidoTable itens={itens} onChangeItem={alterarItem} onRemoveItem={removerItem} />
        </Card>

        <Button onClick={handleSalvar} loading={salvando} disabled={!podeSalvar} style={{ alignSelf: "flex-start" }}>
          Criar pedido
        </Button>
      </div>
    </div>
  );
}
