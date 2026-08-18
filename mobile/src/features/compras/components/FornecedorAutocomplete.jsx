import { Pressable, StyleSheet, Text, View } from "react-native";
import { searchFornecedores } from "../api.js";
import { SearchField } from "../../../ui/SearchField.jsx";
import { colors, radius, spacing } from "../../../ui/theme.js";

export function FornecedorAutocomplete({ selecionado, onSelecionar, onLimpar }) {
  if (selecionado) {
    return (
      <View style={styles.selecionado}>
        <View style={{ flex: 1 }}>
          <Text style={styles.selecionadoNome}>{selecionado.participante.razaoSocial}</Text>
          <Text style={styles.selecionadoSub}>{selecionado.participante.cpfCnpj}</Text>
        </View>
        <Pressable onPress={onLimpar}>
          <Text style={styles.trocar}>Trocar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SearchField
      placeholder="Buscar por nome ou CNPJ/CPF..."
      buscar={searchFornecedores}
      onSelecionar={onSelecionar}
      renderItem={(fornecedor) => (
        <>
          <Text style={styles.opcaoTitulo}>{fornecedor.participante.razaoSocial}</Text>
          <Text style={styles.opcaoSub}>{fornecedor.participante.cpfCnpj}</Text>
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  selecionado: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  selecionadoNome: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  selecionadoSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  trocar: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  opcaoTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  opcaoSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
