import { Feather } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/contexts/AuthContext.jsx";
import { colors, radius, spacing } from "../src/ui/theme.js";

const ROTULO_PAPEL = {
  ADMIN: "Administrador",
  COMPRADOR: "Comprador",
  VENDEDOR: "Vendedor",
  SEPARADOR: "Separador",
  FINANCEIRO: "Financeiro",
  FISCAL: "Fiscal",
  ESTOQUE: "Estoque",
  GESTOR: "Gestor",
};

function InfoLinha({ label, valor }) {
  return (
    <View style={styles.infoLinha}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValor}>{valor}</Text>
    </View>
  );
}

export default function ContaScreen() {
  const { me, signOut } = useAuth();

  function confirmarSaida() {
    Alert.alert("Sair da conta?", "Você precisará entrar novamente para continuar.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.card}>
        <InfoLinha label="Nome" valor={me?.nome ?? "—"} />
        <InfoLinha label="E-mail" valor={me?.email ?? "—"} />
        <InfoLinha label="Papel" valor={ROTULO_PAPEL[me?.role] ?? me?.role ?? "—"} />
      </View>

      <Pressable style={styles.botaoSair} onPress={confirmarSaida}>
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text style={styles.botaoSairTexto}>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  conteudo: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
  },
  infoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValor: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  botaoSair: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.dangerBg,
  },
  botaoSairTexto: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },
});
