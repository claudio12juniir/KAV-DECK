import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

// Mesma lógica do Electron (electron/main.js, getStartUrl): a API e o site
// são servidos pela mesma origem em produção, então basta tirar o sufixo
// "/api/v1" da URL da API pra chegar na raiz do site.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://kav-deck-api.onrender.com/api/v1";
const START_URL = API_URL.replace(/\/api\/v1\/?$/, "");

export default function Home() {
  const webviewRef = useRef(null);
  const canGoBackRef = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBackRef.current) {
        webviewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const onShouldStartLoadWithRequest = useCallback((request) => {
    // Só a origem do próprio site carrega dentro do app — link externo
    // (XML/PDF gerado, etc.) abre no navegador do sistema, igual o
    // `setWindowOpenHandler` do Electron.
    if (request.url.startsWith(START_URL) || request.url === "about:blank") return true;
    Linking.openURL(request.url);
    return false;
  }, []);

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <WebView
        ref={webviewRef}
        source={{ uri: START_URL }}
        style={styles.flex}
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        startInLoadingState={false}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(nav) => {
          canGoBackRef.current = nav.canGoBack;
        }}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      />
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#33c2d6" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0b0b",
  },
});
