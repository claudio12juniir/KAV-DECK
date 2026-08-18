import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useBuscaComDebounce } from "../hooks/useBuscaComDebounce.js";
import { colors, radius, spacing } from "./theme.js";

// Peça reutilizável por trás dos autocompletes de cliente/fornecedor/produto
// (mesmo padrão de busca com debounce do app web) — a lista de resultados
// aparece encaixada logo abaixo do campo, sem overlay flutuante, porque em
// touch isso é mais previsível do que um dropdown posicionado por CSS.
export function SearchField({ placeholder, buscar, renderItem, onSelecionar }) {
  const { termo, setTermo, resultados, buscando } = useBuscaComDebounce(buscar);

  function selecionar(item) {
    onSelecionar(item);
    setTermo("");
  }

  return (
    <View>
      <TextInput style={styles.input} placeholder={placeholder} value={termo} onChangeText={setTermo} />
      <Text style={styles.dica}>{buscando ? "Buscando..." : "Digite ao menos 2 letras"}</Text>

      {resultados.length > 0 && (
        <View style={styles.lista}>
          {resultados.map((item, index) => (
            <Pressable
              key={item.id ?? item.participanteId ?? index}
              style={[styles.opcao, index === resultados.length - 1 && styles.opcaoUltima]}
              onPress={() => selecionar(item)}
            >
              {renderItem(item)}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  dica: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 4,
  },
  lista: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  opcao: {
    padding: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  opcaoUltima: {
    borderBottomWidth: 0,
  },
});
