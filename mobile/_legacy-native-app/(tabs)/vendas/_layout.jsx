import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { ContaHeaderButton } from "../../../src/ui/ContaHeaderButton.jsx";
import { colors } from "../../../src/ui/theme.js";

function HeaderDireita() {
  const router = useRouter();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Pressable onPress={() => router.push("/vendas/novo")} hitSlop={12}>
        <Feather name="plus" size={22} color={colors.text} />
      </Pressable>
      <ContaHeaderButton />
    </View>
  );
}

export default function VendasLayout() {
  return (
    <Stack screenOptions={{ headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="index" options={{ title: "Vendas", headerRight: () => <HeaderDireita /> }} />
      <Stack.Screen name="[id]" options={{ title: "Pedido de venda" }} />
      <Stack.Screen name="novo" options={{ title: "Novo pedido", presentation: "modal" }} />
    </Stack>
  );
}
