import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "./theme.js";

const TONS = {
  neutral: { bg: colors.neutralBg, texto: colors.textMuted },
  accent: { bg: "#e8e8f0", texto: colors.text },
  success: { bg: colors.successBg, texto: colors.success },
  warning: { bg: colors.warningBg, texto: colors.warning },
  danger: { bg: colors.dangerBg, texto: colors.danger },
};

export function Badge({ children, tone = "neutral" }) {
  const t = TONS[tone] ?? TONS.neutral;
  return (
    <View style={[styles.base, { backgroundColor: t.bg }]}>
      <Text style={[styles.texto, { color: t.texto }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  texto: {
    fontSize: 12,
    fontWeight: "600",
  },
});
