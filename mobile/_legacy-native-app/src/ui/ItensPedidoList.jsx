import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "./theme.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Lista editável de itens de um pedido (venda ou compra) em criação — mesmo
// papel do ItensPedidoTable/ItensPedidoCompraTable do app web, mas em
// cards em vez de tabela (mais natural em touch). `comDesconto` liga o
// campo de desconto, que só existe em pedido de venda.
export function ItensPedidoList({ itens, onChangeItem, onRemoveItem, comDesconto = false }) {
  if (itens.length === 0) {
    return <Text style={styles.vazio}>Nenhum produto adicionado ainda.</Text>;
  }

  const total = itens.reduce(
    (soma, item) => soma + Number(item.quantidade || 0) * Number(item.precoUnitario || 0) - Number(item.desconto || 0),
    0,
  );

  return (
    <View>
      {itens.map((item, index) => {
        const subtotal =
          Number(item.quantidade || 0) * Number(item.precoUnitario || 0) - Number(item.desconto || 0);
        return (
          <View key={`${item.produtoId}-${index}`} style={styles.item}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>{item.descricao}</Text>
                <Text style={styles.itemSub}>{item.codigo}</Text>
              </View>
              <Pressable onPress={() => onRemoveItem(index)} hitSlop={8}>
                <Feather name="trash-2" size={18} color={colors.danger} />
              </Pressable>
            </View>

            <View style={styles.campos}>
              <View style={styles.campo}>
                <Text style={styles.label}>Qtd.</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={String(item.quantidade)}
                  onChangeText={(v) => onChangeItem(index, "quantidade", v)}
                />
              </View>
              <View style={styles.campo}>
                <Text style={styles.label}>Preço unit.</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={String(item.precoUnitario)}
                  onChangeText={(v) => onChangeItem(index, "precoUnitario", v)}
                />
              </View>
              {comDesconto && (
                <View style={styles.campo}>
                  <Text style={styles.label}>Desconto</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={String(item.desconto ?? 0)}
                    onChangeText={(v) => onChangeItem(index, "desconto", v)}
                  />
                </View>
              )}
            </View>

            <Text style={styles.subtotal}>Subtotal: {formatarMoeda(subtotal)}</Text>
          </View>
        );
      })}

      <Text style={styles.total}>Total: {formatarMoeda(total)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: {
    fontSize: 13,
    color: colors.textFaint,
  },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  itemTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 2,
  },
  campos: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  campo: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.text,
  },
  subtotal: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "right",
  },
  total: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
    marginTop: spacing.xs,
  },
});
