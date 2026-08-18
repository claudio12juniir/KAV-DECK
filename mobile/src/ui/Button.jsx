import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "./theme.js";

const VARIANTES = {
  primary: { bg: colors.accent, texto: colors.accentText, borda: colors.accent },
  secondary: { bg: colors.card, texto: colors.text, borda: colors.border },
  danger: { bg: colors.card, texto: colors.danger, borda: colors.dangerBg },
};

export function Button({ children, onPress, loading, disabled, variant = "primary", style }) {
  const v = VARIANTES[variant] ?? VARIANTES.primary;
  const desabilitado = Boolean(loading || disabled);

  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={[
        styles.base,
        { backgroundColor: v.bg, borderColor: v.borda },
        desabilitado && styles.desabilitado,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <Text style={[styles.texto, { color: v.texto }]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  desabilitado: {
    opacity: 0.5,
  },
  texto: {
    fontSize: 15,
    fontWeight: "600",
  },
});
