import { Pressable, StyleSheet, Text, View } from "react-native";
import { moodColors } from "@/constants/palette";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Mood } from "@/lib/domain";

export const moodLabels: Record<Mood, string> = { sunny: "Bright", peaceful: "Peaceful", proud: "Proud", connected: "Connected" };
export function MoodChip({ mood, selected, onPress, compact = false }: { mood: Mood; selected?: boolean; onPress?: () => void; compact?: boolean }) {
  const { colors } = useAppTheme();
  const content = <><View style={[styles.dot, { backgroundColor: moodColors[mood] }]} /><Text style={[compact ? styles.compactLabel : styles.label, { color: selected ? colors.ink : colors.muted }]}>{moodLabels[mood]}</Text></>;
  if (!onPress) return <View style={[styles.base, compact && styles.compact, { backgroundColor: colors.surfaceAlt }]}>{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.base, compact && styles.compact, { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.7 : 1 }]}>{content}</Pressable>;
}
const styles = StyleSheet.create({ base: { minHeight: 44, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 22, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 }, compact: { minHeight: 38, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0 }, dot: { width: 9, height: 9, borderRadius: 5 }, label: { fontSize: 15, lineHeight: 21, fontWeight: "700" }, compactLabel: { fontSize: 15, lineHeight: 20, fontWeight: "700" } });
