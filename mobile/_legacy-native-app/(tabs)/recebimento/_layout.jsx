import { Stack } from "expo-router";
import { ContaHeaderButton } from "../../../src/ui/ContaHeaderButton.jsx";

export default function RecebimentoLayout() {
  return (
    <Stack screenOptions={{ headerTitleStyle: { fontWeight: "700" } }}>
      <Stack.Screen name="index" options={{ title: "Recebimento", headerRight: () => <ContaHeaderButton /> }} />
      <Stack.Screen name="[id]" options={{ title: "Receber mercadoria" }} />
    </Stack>
  );
}
