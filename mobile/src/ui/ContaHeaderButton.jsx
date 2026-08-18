import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { colors } from "./theme.js";

// Botão de cabeçalho reaproveitado pela tela inicial de cada aba operacional
// (Vendas, Compras, Separação, Recebimento) — leva pra rota modal /conta.
// Existe porque "Conta" saiu do bottom tab bar: 6 abas era demais pra tela
// de celular, então virou uma rota acessível de qualquer lugar em vez de
// ocupar um slot fixo (ver app/_layout.jsx).
export function ContaHeaderButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push("/conta")} hitSlop={12} style={{ marginRight: 4 }}>
      <Feather name="user" size={20} color={colors.text} />
    </Pressable>
  );
}
