import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProdutoAutocomplete } from "../../../src/features/cadastros/components/ProdutoAutocomplete.jsx";
import { createPedidoVenda } from "../../../src/features/vendas/api.js";
import { ClienteAutocomplete } from "../../../src/features/vendas/components/ClienteAutocomplete.jsx";
import { Button } from "../../../src/ui/Button.jsx";
import { Card } from "../../../src/ui/Card.jsx";
import { ItensPedidoList } from "../../../src/ui/ItensPedidoList.jsx";
import { colors, spacing } from "../../../src/ui/theme.js";

export default function NovoPedidoVendaScreen() {
  const router = useRouter();
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
      router.replace(`/vendas/${pedido.id}`);
    } catch (err) {
      Alert.alert("Não foi possível criar o pedido", err.message ?? "Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Card>
        <Text style={styles.cardTitulo}>Cliente</Text>
        <ClienteAutocomplete selecionado={cliente} onSelecionar={setCliente} onLimpar={() => setCliente(null)} />
        {clienteBloqueado && (
          <Text style={styles.aviso}>
            Este cliente está com bloqueio financeiro ativo e não pode receber novos pedidos.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitulo}>Itens</Text>
        <View style={{ marginBottom: spacing.md }}>
          <ProdutoAutocomplete onSelecionar={adicionarProduto} />
        </View>
        <ItensPedidoList itens={itens} onChangeItem={alterarItem} onRemoveItem={removerItem} comDesconto />
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
  aviso: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
