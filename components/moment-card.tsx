import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { MoodChip } from "@/components/mood-chip";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMomentDate } from "@/lib/date";
import type { Moment, ReactionKind } from "@/lib/domain";
import { haptic } from "@/lib/haptics";
import { useHappy } from "@/lib/happy-store";

const reactionConfig: { kind: ReactionKind; icon: "happy-outline" | "heart-outline" | "sparkles-outline" }[] = [{ kind: "smile", icon: "happy-outline" }, { kind: "heart", icon: "heart-outline" }, { kind: "celebrate", icon: "sparkles-outline" }];
export function MomentCard({ moment, authorName, podName }: { moment: Moment; authorName: string; podName?: string }) {
  const router = useRouter(); const { colors } = useAppTheme(); const { reactToMoment, toggleFavorite } = useHappy();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open moment by ${authorName}`} onPress={() => router.push({ pathname: "/moment/[id]", params: { id: moment.id } } as never)} style={({ pressed }) => [styles.content, { opacity: pressed ? 0.72 : 1 }]}>
      <View style={styles.metaRow}><View style={styles.metaCopy}><Text style={[styles.author, { color: colors.ink }]}>{authorName}</Text><Text style={[styles.meta, { color: colors.muted }]}>{formatMomentDate(moment.createdAt)}{podName ? `  ·  ${podName}` : "  ·  Just me"}</Text></View><MoodChip mood={moment.mood} compact /></View>
      <Text style={[styles.text, { color: colors.ink }]}>{moment.text}</Text>{moment.tags.length > 0 ? <Text style={[styles.tags, { color: colors.muted }]}>{moment.tags.map((tag) => `#${tag.replaceAll(" ", "")}`).join("  ")}</Text> : null}
    </Pressable>
    <View style={[styles.actions, { borderTopColor: colors.border }]}><View style={styles.reactions}>{reactionConfig.map(({ kind, icon }) => { const selected = moment.myReaction === kind; return <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`React with ${kind}`} accessibilityState={{ selected }} onPress={() => { reactToMoment(moment.id, kind); haptic.selection(); }} style={({ pressed }) => [styles.reaction, { backgroundColor: selected ? colors.primarySoft : "transparent", opacity: pressed ? 0.6 : 1 }]}><AppIcon name={icon} size={18} color={selected ? colors.primary : colors.muted} />{moment.reactions[kind] > 0 ? <Text style={[styles.count, { color: selected ? colors.ink : colors.muted }]}>{moment.reactions[kind]}</Text> : null}</Pressable>; })}</View>
      <Pressable accessibilityRole="button" accessibilityLabel={moment.isFavorite ? "Remove from favorites" : "Add to favorites"} onPress={() => { toggleFavorite(moment.id); haptic.light(); }} hitSlop={8} style={({ pressed }) => [styles.favorite, { opacity: pressed ? 0.55 : 1 }]}><AppIcon name={moment.isFavorite ? "bookmark" : "bookmark-outline"} size={19} color={moment.isFavorite ? colors.coral : colors.muted} /></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({ card: { borderRadius: 22, borderWidth: 1, overflow: "hidden", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, content: { padding: 18 }, metaRow: { flexDirection: "row", alignItems: "center", gap: 10 }, metaCopy: { flex: 1 }, author: { fontSize: 14, lineHeight: 19, fontWeight: "800" }, meta: { fontSize: 12, lineHeight: 17, marginTop: 2 }, text: { fontSize: 17, lineHeight: 25, fontWeight: "500", marginTop: 14, letterSpacing: -0.15 }, tags: { fontSize: 12, lineHeight: 18, marginTop: 12, fontWeight: "600" }, actions: { minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 }, reactions: { flexDirection: "row", alignItems: "center", gap: 4 }, reaction: { minWidth: 42, height: 34, paddingHorizontal: 8, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }, count: { fontSize: 12, lineHeight: 16, fontWeight: "700" }, favorite: { width: 42, height: 42, alignItems: "center", justifyContent: "center" } });
