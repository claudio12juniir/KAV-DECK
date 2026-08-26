import { StyleSheet, View } from "react-native";
import { cardShadow, colors, radius, spacing } from "./theme.js";

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md + 4,
    ...cardShadow,
  },
});
