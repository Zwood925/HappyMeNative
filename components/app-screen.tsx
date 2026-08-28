import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/use-app-theme";

export function AppScreen({ children, edges = ["top", "left", "right"], style }: PropsWithChildren<{ edges?: Edge[]; style?: ViewStyle }>) {
  const { colors } = useAppTheme();
  return <View style={[styles.root, { backgroundColor: colors.background }]}><SafeAreaView edges={edges} style={[styles.safeArea, style]}>{children}</SafeAreaView></View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, safeArea: { flex: 1 } });
