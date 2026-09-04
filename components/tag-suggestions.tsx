import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Mood } from "@/lib/domain";
import { haptic } from "@/lib/haptics";
import { getSuggestedTags, normalizeTag } from "@/lib/tag-suggestions";

interface TagSuggestionsProps {
  text: string;
  mood: Mood;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean;
  allowCustom?: boolean;
}

export function TagSuggestions({ text, mood, selectedTags, onChange, compact = false, allowCustom = false }: TagSuggestionsProps) {
  const { colors } = useAppTheme();
  const [customTag, setCustomTag] = useState("");
  const suggestions = useMemo(() => getSuggestedTags(text, mood, compact ? 3 : 5).filter((tag) => !selectedTags.includes(tag)), [compact, mood, selectedTags, text]);

  function addTag(rawTag: string) {
    const tag = normalizeTag(rawTag);
    if (!tag || selectedTags.includes(tag) || selectedTags.length >= 5) return;
    onChange([...selectedTags, tag]);
    setCustomTag("");
    haptic.selection();
  }

  function removeTag(tag: string) {
    onChange(selectedTags.filter((item) => item !== tag));
    haptic.selection();
  }

  if (!text.trim() && selectedTags.length === 0 && !allowCustom) return null;

  return <View style={styles.container}>
    {selectedTags.length > 0 ? <View style={styles.wrap}>{selectedTags.map((tag) => <Pressable key={tag} accessibilityRole="button" accessibilityLabel={`Remove ${tag} tag`} onPress={() => removeTag(tag)} style={[styles.selectedChip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}><Text style={[styles.selectedText, { color: colors.ink }]}>#{tag.replaceAll(" ", "")}</Text><AppIcon name="close" size={13} color={colors.ink} /></Pressable>)}</View> : null}
    {suggestions.length > 0 ? <View><Text style={[styles.label, { color: colors.muted }]}>{compact ? "SUGGESTED TAGS" : "TAP TO ADD"}</Text><View style={styles.wrap}>{suggestions.map((tag) => <Pressable key={tag} accessibilityRole="button" accessibilityLabel={`Add ${tag} tag`} onPress={() => addTag(tag)} style={({ pressed }) => [styles.suggestionChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}><AppIcon name="add" size={14} color={colors.coral} /><Text style={[styles.suggestionText, { color: colors.muted }]}>#{tag.replaceAll(" ", "")}</Text></Pressable>)}</View></View> : null}
    {allowCustom ? <View style={styles.customRow}><TextInput accessibilityLabel="Custom tag" value={customTag} onChangeText={setCustomTag} onSubmitEditing={() => addTag(customTag)} returnKeyType="done" maxLength={28} placeholder="Add your own tag" placeholderTextColor={colors.muted} style={[styles.customInput, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border }]} /><Pressable accessibilityRole="button" accessibilityLabel="Add custom tag" accessibilityState={{ disabled: !normalizeTag(customTag) }} disabled={!normalizeTag(customTag)} onPress={() => addTag(customTag)} style={({ pressed }) => [styles.addButton, { backgroundColor: normalizeTag(customTag) ? colors.ink : colors.border, opacity: pressed ? 0.7 : 1 }]}><AppIcon name="add" size={20} color={colors.background} /></Pressable></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 9 },
  label: { fontSize: 13, lineHeight: 18, letterSpacing: 1.05, fontWeight: "800", marginBottom: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  selectedChip: { minHeight: 40, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  selectedText: { fontSize: 15, lineHeight: 21, fontWeight: "800" },
  suggestionChip: { minHeight: 40, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  suggestionText: { fontSize: 15, lineHeight: 21, fontWeight: "700" },
  customRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  customInput: { flex: 1, minHeight: 48, borderRadius: 24, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15, lineHeight: 22 },
  addButton: { minWidth: 48, minHeight: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
