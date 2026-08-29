import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Pod } from "@/lib/domain";
import { haptic } from "@/lib/haptics";

interface AudiencePickerProps {
  pods: Pod[];
  currentMemberId: string;
  selectedPodId?: string;
  onChange: (podId?: string) => void;
  privateLabel?: string;
  memberId?: string;
  compact?: boolean;
  onCreatePod?: () => void;
}

export function AudiencePicker({ pods, currentMemberId, selectedPodId, onChange, privateLabel = "Just me", memberId, compact = false, onCreatePod }: AudiencePickerProps) {
  const { colors } = useAppTheme();
  const eligiblePods = pods.filter((pod) => pod.memberIds.includes(currentMemberId) && (!memberId || pod.memberIds.includes(memberId)));
  const options = [{ id: "private", name: privateLabel, memberCount: 1 }, ...(onCreatePod ? [{ id: "create", name: "New pod", memberCount: 0 }] : []), ...eligiblePods.map((pod) => ({ id: pod.id, name: pod.name, memberCount: pod.memberIds.length }))];

  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup">
    {options.map((item) => {
      if (item.id === "create") return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel="Create a new pod" onPress={() => { haptic.light(); onCreatePod?.(); }} style={({ pressed }) => [styles.createOption, compact && styles.createOptionCompact, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><View style={[styles.createIcon, { backgroundColor: colors.ink }]}><AppIcon name="add" size={18} color={colors.background} /></View><Text style={[styles.createName, { color: colors.ink }]}>New pod</Text></Pressable>;
      const selected = item.id === "private" ? !selectedPodId : selectedPodId === item.id;
      const isPrivate = item.id === "private";
      return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={isPrivate ? item.name : `${item.name}, ${item.memberCount} members`} onPress={() => { onChange(isPrivate ? undefined : item.id); haptic.selection(); }} style={({ pressed }) => [styles.option, compact && styles.optionCompact, { backgroundColor: selected ? colors.primarySoft : colors.surface, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.65 : 1 }]}>
        <View style={[styles.icon, { backgroundColor: selected ? colors.primary : colors.surfaceAlt }]}><AppIcon name={isPrivate ? "lock-closed-outline" : "people-outline"} size={compact ? 15 : 17} color={colors.ink} /></View>
        <View style={styles.copy}><Text numberOfLines={1} style={[styles.name, { color: colors.ink }]}>{item.name}</Text>{compact ? null : <Text style={[styles.detail, { color: colors.muted }]}>{isPrivate ? "Only on this account" : `${item.memberCount} members`}</Text>}</View>
        {selected ? <AppIcon name="checkmark-circle" size={17} color={colors.coral} /> : null}
      </Pressable>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 18 },
  option: { minWidth: 166, minHeight: 58, paddingHorizontal: 11, borderRadius: 18, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9 },
  optionCompact: { minWidth: 126, minHeight: 46, borderRadius: 23, paddingHorizontal: 9 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  name: { fontSize: 12, lineHeight: 17, fontWeight: "800", maxWidth: 118 },
  detail: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  createOption: { minWidth: 126, minHeight: 58, paddingHorizontal: 11, borderRadius: 18, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9 },
  createOptionCompact: { minHeight: 46, borderRadius: 23, paddingHorizontal: 9 },
  createIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  createName: { fontSize: 12, lineHeight: 17, fontWeight: "900" },
});
