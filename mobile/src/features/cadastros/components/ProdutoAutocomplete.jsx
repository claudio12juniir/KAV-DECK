import { Text } from "react-native";
import { searchProdutos } from "../api.js";
import { SearchField } from "../../../ui/SearchField.jsx";
import { colors } from "../../../ui/theme.js";

export function ProdutoAutocomplete({ onSelecionar }) {
  return (
    <SearchField
      placeholder="Buscar produto por código ou descrição..."
      buscar={searchProdutos}
      onSelecionar={onSelecionar}
      renderItem={(produto) => (
        <>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{produto.descricao}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{produto.codigo}</Text>
        </>
      )}
    />
  );
}
