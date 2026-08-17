import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { ProdutoAutocomplete } from "../shared/ProdutoAutocomplete.jsx";
import { createPedidoCompra } from "./api.js";
import { FornecedorAutocomplete } from "./components/FornecedorAutocomplete.jsx";
import { ItensPedidoCompraTable } from "./components/ItensPedidoCompraTable.jsx";

export function NovoPedidoCompraPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [fornecedor, setFornecedor] = useState(null);
  const [itens, setItens] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const podeSalvar = fornecedor && itens.length > 0 && !salvando;

  function adicionarProduto(produto) {
    setItens((prev) => [
      ...prev,
      {
        produtoId: produto.id,
        codigo: produto.codigo,
        descricao: produto.descricao,
        quantidade: 1,
        precoUnitario: produto.precoReferencia ?? 0,
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
      const pedido = await createPedidoCompra({
        fornecedorId: fornecedor.participanteId,
        itens: itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: String(item.quantidade),
          precoUnitario: String(item.precoUnitario),
        })),
      });
      toast.success("Pedido de compra criado com sucesso.");
      navigate(`/compras/${pedido.id}`);
    } catch (err) {
      toast.error(err.message ?? "Não foi possível criar o pedido.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1>Novo pedido de compra</h1>
      <p>Busque o fornecedor, adicione os produtos e confirme.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "760px" }}>
        <Card>
          <h3>Fornecedor</h3>
          <FornecedorAutocomplete
            selecionado={fornecedor}
            onSelecionar={setFornecedor}
            onLimpar={() => setFornecedor(null)}
          />
        </Card>

        <Card>
          <h3>Itens</h3>
          <div style={{ marginBottom: "24px" }}>
            <ProdutoAutocomplete onSelecionar={adicionarProduto} />
          </div>
          <ItensPedidoCompraTable itens={itens} onChangeItem={alterarItem} onRemoveItem={removerItem} />
        </Card>

        <Button onClick={handleSalvar} loading={salvando} disabled={!podeSalvar} style={{ alignSelf: "flex-start" }}>
          Criar pedido
        </Button>
      </div>
    </div>
  );
}
