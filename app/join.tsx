import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { AppScreen } from "@/components/app-screen";
import { useAppTheme } from "@/hooks/use-app-theme";
import { haptic } from "@/lib/haptics";
import { useHappy } from "@/lib/happy-store";
import { parsePodInvite } from "@/lib/pod-invites";

export default function JoinPodScreen() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const router = useRouter();
  const { colors } = useAppTheme();
  const { joinPodFromInvite } = useHappy();
  const handled = useRef(false);
  const [joinedPodId, setJoinedPodId] = useState<string | null>(null);
  const invite = parsePodInvite(params);

  useEffect(() => {
    if (handled.current || !invite) return;
    handled.current = true;
    setJoinedPodId(joinPodFromInvite(invite));
    haptic.success();
  }, [invite, joinPodFromInvite]);

  if (!invite) return <AppScreen edges={["top", "bottom", "left", "right"]}><View style={styles.center}><View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}><AppIcon name="link-outline" size={30} color={colors.coral} /></View><Text style={[styles.title, { color: colors.ink }]}>This invite needs a refresh.</Text><Text style={[styles.body, { color: colors.muted }]}>Ask the pod owner to send a new HappyMe invite link or enter the invite code from the Pods tab.</Text><Pressable onPress={() => router.replace("/pods" as never)} style={[styles.primary, { backgroundColor: colors.ink }]}><Text style={[styles.primaryText, { color: colors.background }]}>Open Pods</Text></Pressable></View></AppScreen>;

  return <AppScreen edges={["top", "bottom", "left", "right"]}><View style={styles.center}><View style={[styles.icon, { backgroundColor: invite.color }]}><AppIcon name="people" size={31} color="#FFFFFF" /></View><Text style={[styles.eyebrow, { color: colors.coral }]}>YOU’RE INVITED</Text><Text style={[styles.title, { color: colors.ink }]}>{invite.name}</Text><Text style={[styles.body, { color: colors.muted }]}>{invite.description}</Text><View style={[styles.code, { backgroundColor: colors.surfaceAlt }]}><Text style={[styles.codeLabel, { color: colors.muted }]}>INVITE CODE</Text><Text style={[styles.codeValue, { color: colors.ink }]}>{invite.inviteCode}</Text></View><Pressable disabled={!joinedPodId} onPress={() => router.replace({ pathname: "/pod/[id]", params: { id: joinedPodId ?? invite.podId } } as never)} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={[styles.primaryText, { color: colors.ink }]}>Open your new pod</Text><AppIcon name="arrow-forward" size={19} color={colors.ink} /></Pressable></View></AppScreen>;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }, icon: { width: 72, height: 72, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 18 }, eyebrow: { fontSize: 11, lineHeight: 15, letterSpacing: 1.4, fontWeight: "900", marginBottom: 7 }, title: { fontSize: 30, lineHeight: 37, fontWeight: "900", letterSpacing: -0.6, textAlign: "center" }, body: { fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 330, marginTop: 8 }, code: { width: "100%", minHeight: 76, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 22 }, codeLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.1, fontWeight: "800" }, codeValue: { fontSize: 20, lineHeight: 26, letterSpacing: 3, fontWeight: "900", marginTop: 2 }, primary: { width: "100%", minHeight: 54, borderRadius: 27, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, primaryText: { fontSize: 15, lineHeight: 20, fontWeight: "900" } });
