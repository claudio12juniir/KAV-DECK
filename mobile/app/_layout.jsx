import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext.jsx";
import { RealtimeProvider } from "../src/contexts/RealtimeContext.jsx";

function AvisoSessaoEncerrada() {
  const { sessaoEncerradaMotivo, limparAvisoSessaoEncerrada } = useAuth();

  useEffect(() => {
    if (!sessaoEncerradaMotivo) return;
    Alert.alert("Sessão encerrada", sessaoEncerradaMotivo, [{ text: "OK", onPress: limparAvisoSessaoEncerrada }]);
  }, [sessaoEncerradaMotivo, limparAvisoSessaoEncerrada]);

  return null;
}

function Gate({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RealtimeProvider>
          <AvisoSessaoEncerrada />
          <Gate>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="conta" options={{ presentation: "modal", title: "Conta" }} />
            </Stack>
          </Gate>
        </RealtimeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
