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
const styles = StyleSheet.create({ base: { minHeight: 38, paddingHorizontal: 12, borderRadius: 19, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 }, compact: { minHeight: 30, paddingHorizontal: 9, borderWidth: 0 }, dot: { width: 8, height: 8, borderRadius: 4 }, label: { fontSize: 13, lineHeight: 18, fontWeight: "700" }, compactLabel: { fontSize: 12, lineHeight: 16, fontWeight: "700" } });
