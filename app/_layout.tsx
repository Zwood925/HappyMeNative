import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppTheme } from "@/hooks/use-app-theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { HappyProvider } from "@/lib/happy-store";

function AppNavigator() {
  const { colors, isDark } = useAppTheme();
  const { session, loading } = useAuth(); const pathname = usePathname(); const publicRoute = pathname === "/auth" || pathname.startsWith("/auth/") || ["/join", "/support", "/privacy", "/terms"].includes(pathname);
  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.coral} /></View>;
  if (!session && !publicRoute) return <Redirect href={"/auth" as never} />;
  if (session && pathname === "/auth") return <Redirect href={"/" as never} />;
  return <><StatusBar style={isDark ? "light" : "dark"} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "slide_from_right" }}><Stack.Screen name="auth" options={{ animation: "fade" }} /><Stack.Screen name="auth/callback" options={{ animation: "fade" }} /><Stack.Screen name="auth/reset-password" options={{ animation: "fade" }} /><Stack.Screen name="(tabs)" /><Stack.Screen name="compose" options={{ presentation: "modal", animation: "slide_from_bottom" }} /><Stack.Screen name="moment/[id]" /><Stack.Screen name="pod/[id]" /><Stack.Screen name="join" /><Stack.Screen name="friends" /><Stack.Screen name="report" options={{ presentation: "modal", animation: "slide_from_bottom" }} /><Stack.Screen name="support" /><Stack.Screen name="privacy" /><Stack.Screen name="terms" /><Stack.Screen name="account/delete" /><Stack.Screen name="encouragement/compose" options={{ presentation: "modal", animation: "slide_from_bottom" }} /></Stack></>;
}
export default function RootLayout() { return <GestureHandlerRootView style={{ flex: 1 }}><AuthProvider><HappyProvider><AppNavigator /></HappyProvider></AuthProvider></GestureHandlerRootView>; }

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center" } });
