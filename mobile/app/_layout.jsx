import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

// O app mobile é um shell fino: abre o site (React) de produção dentro de
// uma WebView (ver index.jsx), igual o app desktop Electron já faz — em vez
// de reimplementar cada tela do ERP nativamente. Garante paridade total com
// a versão web/desktop por construção, sem duas bases de código pra manter
// sincronizadas.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
