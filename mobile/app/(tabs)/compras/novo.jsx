import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProdutoAutocomplete } from "../../../src/features/cadastros/components/ProdutoAutocomplete.jsx";
import { createPedidoCompra } from "../../../src/features/compras/api.js";
import { FornecedorAutocomplete } from "../../../src/features/compras/components/FornecedorAutocomplete.jsx";
import { Button } from "../../../src/ui/Button.jsx";
import { Card } from "../../../src/ui/Card.jsx";
import { ItensPedidoList } from "../../../src/ui/ItensPedidoList.jsx";
import { colors, spacing } from "../../../src/ui/theme.js";

export default function NovoPedidoCompraScreen() {
  const router = useRouter();
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
      router.replace(`/compras/${pedido.id}`);
    } catch (err) {
      Alert.alert("Não foi possível criar o pedido", err.message ?? "Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Card>
        <Text style={styles.cardTitulo}>Fornecedor</Text>
        <FornecedorAutocomplete
          selecionado={fornecedor}
          onSelecionar={setFornecedor}
          onLimpar={() => setFornecedor(null)}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitulo}>Itens</Text>
        <View style={{ marginBottom: spacing.md }}>
          <ProdutoAutocomplete onSelecionar={adicionarProduto} />
        </View>
        <ItensPedidoList itens={itens} onChangeItem={alterarItem} onRemoveItem={removerItem} />
      </Card>

      <Button onPress={handleSalvar} loading={salvando} disabled={!podeSalvar}>
        Criar pedido
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteudo: {
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
