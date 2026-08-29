import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PodInvitePayload } from "@/lib/pod-invites";
import { supabase } from "@/lib/supabase";

const PENDING_INVITE_KEY = "happyme.pending-pod-invite.v1";

export async function savePendingInvite(invite: PodInvitePayload) {
  await AsyncStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
}

export async function getPendingInvite(): Promise<PodInvitePayload | null> {
  const value = await AsyncStorage.getItem(PENDING_INVITE_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as PodInvitePayload; } catch { await AsyncStorage.removeItem(PENDING_INVITE_KEY); return null; }
}

export async function clearPendingInvite() { await AsyncStorage.removeItem(PENDING_INVITE_KEY); }

export async function claimPendingInvite() {
  const invite = await getPendingInvite();
  if (!invite) return null;
  const response = invite.inviteToken
    ? await supabase.rpc("claim_pod_invite", { p_invite_token: invite.inviteToken })
    : await supabase.rpc("join_pod_by_code", { p_invite_code: invite.inviteCode });
  if (response.error) throw new Error(response.error.message);
  await clearPendingInvite();
  return response.data as string;
}
