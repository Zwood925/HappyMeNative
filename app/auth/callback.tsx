import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { AppScreen } from "@/components/app-screen";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string }>(); const router = useRouter(); const { colors } = useAppTheme(); const [error, setError] = useState("");
  useEffect(() => { if (!params.code) { setError("The confirmation link is missing its sign-in code."); return; } supabase.auth.exchangeCodeForSession(params.code).then(({ error: exchangeError }) => { if (exchangeError) setError(exchangeError.message); else router.replace("/" as never); }); }, [params.code, router]);
  return <AppScreen edges={["top", "bottom", "left", "right"]}><View style={styles.center}>{error ? <><View style={[styles.icon, { backgroundColor: `${colors.danger}16` }]}><AppIcon name="alert-circle-outline" size={32} color={colors.danger} /></View><Text style={[styles.title, { color: colors.ink }]}>That link did not work.</Text><Text style={[styles.body, { color: colors.muted }]}>{error}</Text><Pressable onPress={() => router.replace("/auth" as never)} style={[styles.button, { backgroundColor: colors.ink }]}><Text style={[styles.buttonText, { color: colors.background }]}>Back to sign in</Text></Pressable></> : <><ActivityIndicator size="large" color={colors.coral} /><Text style={[styles.title, { color: colors.ink }]}>Confirming your account…</Text></>}</View></AppScreen>;
}
const styles = StyleSheet.create({ center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 12 }, icon: { width: 66, height: 66, borderRadius: 23, alignItems: "center", justifyContent: "center" }, title: { fontSize: 25, lineHeight: 32, fontWeight: "900", textAlign: "center" }, body: { fontSize: 15, lineHeight: 21, textAlign: "center" }, button: { alignSelf: "stretch", minHeight: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginTop: 10 }, buttonText: { fontSize: 15, lineHeight: 22, fontWeight: "900" } });
