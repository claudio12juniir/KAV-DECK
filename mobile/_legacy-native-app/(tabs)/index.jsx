import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/contexts/AuthContext.jsx";
import { useRealtime } from "../../src/contexts/RealtimeContext.jsx";
import { ContaHeaderButton } from "../../src/ui/ContaHeaderButton.jsx";
import { cardShadow, colors, radius, spacing } from "../../src/ui/theme.js";

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function InicioScreen() {
  const { me } = useAuth();
  const { connected } = useRealtime();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl }}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{saudacao()}</Text>
          <Text style={styles.titulo}>Olá, {me?.nome?.split(" ")[0] ?? "!"}</Text>
        </View>
        <ContaHeaderButton />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
        <Text style={styles.statusTexto}>{connected ? "Tempo real conectado" : "Conectando..."}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Vendas, Compras, Separação e Recebimento</Text>
        <Text style={styles.cardTexto}>
          Use as abas abaixo para criar e acompanhar pedidos, separar vendas por lote e registrar
          recebimentos de mercadoria — tudo sincronizado em tempo real com o KAV DECK web.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md + 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: colors.success,
  },
  dotOff: {
    backgroundColor: colors.border,
  },
  statusTexto: {
    fontSize: 13,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md + 4,
    ...cardShadow,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
