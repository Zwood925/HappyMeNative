import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { AppScreen } from "@/components/app-screen";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { useHappy } from "@/lib/happy-store";
import { savePendingInvite } from "@/lib/pending-invite";
import { parsePodInvite, type PodInvitePayload } from "@/lib/pod-invites";
import { supabase } from "@/lib/supabase";

const APP_STORE_URL = process.env.EXPO_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com/app/id6806403132";

export default function JoinPodScreen() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const router = useRouter(); const { colors } = useAppTheme(); const { user } = useAuth(); const { joinPodFromInvite } = useHappy();
  const parsedInvite = useMemo(() => parsePodInvite(params), [params]);
  const [invite, setInvite] = useState<PodInvitePayload | null>(parsedInvite); const [joinedPodId, setJoinedPodId] = useState<string | null>(null); const [working, setWorking] = useState(false); const [error, setError] = useState("");

  useEffect(() => {
    if (parsedInvite || !params.token || Array.isArray(params.token)) return;
    supabase.rpc("get_invite_preview", { p_invite_token: params.token }).then(({ data }) => {
      const row = data?.[0] as { pod_id?: string; pod_name?: string; pod_description?: string; pod_color?: string } | undefined;
      if (row?.pod_id && row.pod_name) setInvite({ podId: row.pod_id, inviteCode: String(params.code ?? "INVITE"), inviteToken: params.token as string, name: row.pod_name, description: row.pod_description ?? "A private place for small joys.", color: row.pod_color ?? "#F27C72" });
    });
  }, [params.code, params.token, parsedInvite]);

  async function continueInvite() {
    if (!invite || working) return; setWorking(true); setError("");
    try {
      if (!user) { await savePendingInvite(invite); router.replace("/auth" as never); return; }
      const podId = await joinPodFromInvite(invite); setJoinedPodId(podId); haptic.success();
    } catch { setError("This invitation is unavailable or could not be claimed. Ask the pod owner for a fresh link."); haptic.error(); }
    finally { setWorking(false); }
  }

  if (!invite) return <AppScreen edges={["top", "bottom", "left", "right"]}><View style={styles.center}><View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}><AppIcon name="link-outline" size={30} color={colors.coral} /></View><Text style={[styles.title, { color: colors.ink }]}>This invite needs a refresh.</Text><Text style={[styles.body, { color: colors.muted }]}>Ask the pod owner to send a new HappyMe invite link or enter the code from the Pods tab.</Text>{Platform.OS !== "web" ? <Pressable onPress={() => router.replace("/pods" as never)} style={[styles.primary, { backgroundColor: colors.ink }]}><Text style={[styles.primaryText, { color: colors.background }]}>Open Pods</Text></Pressable> : null}</View></AppScreen>;

  const isWeb = Platform.OS === "web";
  return <AppScreen edges={["top", "bottom", "left", "right"]}><View style={styles.center}><View style={[styles.icon, { backgroundColor: invite.color }]}><AppIcon name="people" size={31} color="#FFFFFF" /></View><Text style={[styles.eyebrow, { color: colors.coral }]}>YOU’RE INVITED</Text><Text style={[styles.title, { color: colors.ink }]}>{invite.name}</Text><Text style={[styles.body, { color: colors.muted }]}>{invite.description}</Text><View style={[styles.code, { backgroundColor: colors.surfaceAlt }]}><Text style={[styles.codeLabel, { color: colors.muted }]}>INVITE CODE</Text><Text style={[styles.codeValue, { color: colors.ink }]}>{invite.inviteCode}</Text></View>{error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}{isWeb ? <><Pressable onPress={() => void Linking.openURL(APP_STORE_URL)} style={[styles.primary, { backgroundColor: colors.primary }]}><AppIcon name="logo-apple" size={20} color={colors.ink} /><Text style={[styles.primaryText, { color: colors.ink }]}>Get HappyMe</Text></Pressable><Text style={[styles.footnote, { color: colors.muted }]}>After installing, return to this text message and tap the invite link again. You will not need to enter the code.</Text></> : joinedPodId ? <Pressable onPress={() => router.replace({ pathname: "/pod/[id]", params: { id: joinedPodId } } as never)} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={[styles.primaryText, { color: colors.ink }]}>Open your new pod</Text><AppIcon name="arrow-forward" size={19} color={colors.ink} /></Pressable> : <Pressable disabled={working} onPress={continueInvite} style={[styles.primary, { backgroundColor: colors.primary }]}>{working ? <ActivityIndicator color={colors.ink} /> : <><Text style={[styles.primaryText, { color: colors.ink }]}>{user ? "Join this pod" : "Continue to HappyMe"}</Text><AppIcon name="arrow-forward" size={19} color={colors.ink} /></>}</Pressable>}</View></AppScreen>;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }, icon: { width: 72, height: 72, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 18 }, eyebrow: { fontSize: 11, lineHeight: 15, letterSpacing: 1.4, fontWeight: "900", marginBottom: 7 }, title: { fontSize: 30, lineHeight: 37, fontWeight: "900", letterSpacing: -0.6, textAlign: "center" }, body: { fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 330, marginTop: 8 }, code: { width: "100%", minHeight: 76, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 22 }, codeLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.1, fontWeight: "800" }, codeValue: { fontSize: 20, lineHeight: 26, letterSpacing: 3, fontWeight: "900", marginTop: 2 }, primary: { width: "100%", minHeight: 54, borderRadius: 27, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, primaryText: { fontSize: 15, lineHeight: 20, fontWeight: "900" }, error: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 12, fontWeight: "700" }, footnote: { fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 330, marginTop: 13 } });
