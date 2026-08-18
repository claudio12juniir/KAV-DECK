import { Stack } from "expo-router";
import { ContaHeaderButton } from "../../../src/ui/ContaHeaderButton.jsx";

export default function SeparadorLayout() {
  return (
    <Stack screenOptions={{ headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="index" options={{ title: "Separação", headerRight: () => <ContaHeaderButton /> }} />
      <Stack.Screen name="[id]" options={{ title: "Pedido de venda" }} />
    </Stack>
  );
}
