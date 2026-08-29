import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { useAuth } from "@/lib/auth";
import type { Encouragement, HappySnapshot, HappyState, Member, Moment, NewEncouragementInput, NewMomentInput, NewPodInput, Pod, Preferences, ReactionKind } from "@/lib/domain";
import type { PodInvitePayload } from "@/lib/pod-invites";
import { claimPendingInvite } from "@/lib/pending-invite";
import { supabase } from "@/lib/supabase";
import { happyReducer as reducer, toSnapshot } from "@/lib/happy-reducer";

const CACHE_PREFIX = "happyme.cloud.snapshot.v1";
const DEFAULT_PREFERENCES: Preferences = { appearance: "system", remindersEnabled: false, celebrationSounds: true, displayName: "Happy friend" };

function emptySnapshot(userId = ""): HappySnapshot {
  return { schemaVersion: 1, currentMemberId: userId, moments: [], pods: [], members: [], encouragements: [], preferences: DEFAULT_PREFERENCES };
}

function initialState(): HappyState { return { ...emptySnapshot(), hydrated: false, syncing: false }; }

function messageFor(error: unknown) { return error instanceof Error ? error.message : "HappyMe could not reach the cloud. Your last synced view is still available."; }

async function requireData<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

async function loadCloudSnapshot(userId: string): Promise<HappySnapshot> {
  const [profile, podsRows, memberRows, momentRows, reactionRows, encouragementRows, profileRows] = await Promise.all([
    requireData(supabase.from("profiles").select("id,display_name,initials,avatar_color,appearance,reminders_enabled,celebration_haptics").eq("id", userId).single()),
    requireData(supabase.from("pods").select("id,owner_id,name,description,color,invite_code,invite_token,created_at").order("created_at", { ascending: false })),
    requireData(supabase.from("pod_members").select("pod_id,user_id,role,joined_at")),
    requireData(supabase.from("moments").select("id,author_id,pod_id,body,mood,tags,is_favorite,created_at,updated_at").order("created_at", { ascending: false })),
    requireData(supabase.from("moment_reactions").select("moment_id,user_id,kind")),
    requireData(supabase.from("encouragements").select("id,sender_id,recipient_id,pod_id,body,created_at,read_at").order("created_at", { ascending: false })),
    requireData(supabase.from("profiles").select("id,display_name,initials,avatar_color")),
  ]);

  const members = ((profileRows ?? []) as Array<Record<string, string>>).map<Member>((row) => ({ id: row.id, name: row.display_name, initials: row.initials, color: row.avatar_color }));
  const memberIdsByPod = new Map<string, string[]>();
  for (const row of (memberRows ?? []) as Array<Record<string, string>>) memberIdsByPod.set(row.pod_id, [...(memberIdsByPod.get(row.pod_id) ?? []), row.user_id]);
  const pods = ((podsRows ?? []) as Array<Record<string, string>>).map<Pod>((row) => ({ id: row.id, ownerId: row.owner_id, name: row.name, description: row.description, color: row.color, memberIds: memberIdsByPod.get(row.id) ?? [], inviteCode: row.invite_code, inviteToken: row.invite_token, createdAt: row.created_at }));
  const reactionsByMoment = new Map<string, { smile: number; heart: number; celebrate: number; mine?: ReactionKind }>();
  for (const row of (reactionRows ?? []) as Array<Record<string, string>>) {
    const current = reactionsByMoment.get(row.moment_id) ?? { smile: 0, heart: 0, celebrate: 0 };
    const kind = row.kind as ReactionKind; current[kind] += 1; if (row.user_id === userId) current.mine = kind; reactionsByMoment.set(row.moment_id, current);
  }
  const moments = ((momentRows ?? []) as Array<Record<string, unknown>>).map<Moment>((row) => {
    const reaction = reactionsByMoment.get(row.id as string) ?? { smile: 0, heart: 0, celebrate: 0 };
    return { id: row.id as string, authorId: row.author_id as string, podId: (row.pod_id as string | null) ?? undefined, text: row.body as string, mood: row.mood as Moment["mood"], tags: row.tags as string[], isFavorite: row.is_favorite as boolean, createdAt: row.created_at as string, updatedAt: row.updated_at as string, myReaction: reaction.mine, reactions: { smile: reaction.smile, heart: reaction.heart, celebrate: reaction.celebrate } };
  });
  const encouragements = ((encouragementRows ?? []) as Array<Record<string, unknown>>).map<Encouragement>((row) => ({ id: row.id as string, fromMemberId: row.sender_id as string, toMemberId: row.recipient_id as string, podId: (row.pod_id as string | null) ?? undefined, message: row.body as string, createdAt: row.created_at as string, read: Boolean(row.read_at) }));
  if (!profile) throw new Error("Your HappyMe profile is unavailable.");
  const currentProfile = profile as unknown as Record<string, unknown>;
  if (!members.some((member) => member.id === userId)) members.push({ id: userId, name: currentProfile.display_name as string, initials: currentProfile.initials as string, color: currentProfile.avatar_color as string });
  return { schemaVersion: 1, currentMemberId: userId, moments, pods, members, encouragements, preferences: { displayName: currentProfile.display_name as string, appearance: currentProfile.appearance as Preferences["appearance"], remindersEnabled: currentProfile.reminders_enabled as boolean, celebrationSounds: currentProfile.celebration_haptics as boolean } };
}

interface HappyContextValue {
  state: HappyState;
  refresh: () => Promise<void>;
  addMoment: (input: NewMomentInput) => Promise<string>;
  updateMoment: (id: string, input: Pick<NewMomentInput, "text" | "mood" | "podId">) => Promise<void>;
  deleteMoment: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  reactToMoment: (id: string, reaction: ReactionKind) => Promise<void>;
  createPod: (input: NewPodInput) => Promise<Pod>;
  joinPodByCode: (code: string) => Promise<boolean>;
  joinPodFromInvite: (invite: PodInvitePayload) => Promise<string>;
  sendEncouragement: (input: NewEncouragementInput) => Promise<string>;
  markEncouragementRead: (id: string) => Promise<void>;
  updatePreferences: (input: Partial<Preferences>) => Promise<void>;
  resetData: () => Promise<void>;
  exportSnapshot: () => string;
}

const HappyContext = createContext<HappyContextValue | null>(null);

export function HappyProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state); stateRef.current = state;
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    dispatch({ type: "SYNC_START" });
    try {
      const snapshot = await loadCloudSnapshot(user.id);
      dispatch({ type: "SYNC_SUCCESS", payload: snapshot });
      await AsyncStorage.setItem(`${CACHE_PREFIX}.${user.id}`, JSON.stringify(snapshot));
    } catch (error) { dispatch({ type: "SYNC_ERROR", payload: messageFor(error) }); }
  }, [user]);

  useEffect(() => {
    if (!user) { dispatch({ type: "HYDRATE", payload: emptySnapshot() }); return; }
    let active = true;
    AsyncStorage.getItem(`${CACHE_PREFIX}.${user.id}`).then((value) => {
      if (!active) return;
      if (value) dispatch({ type: "HYDRATE", payload: JSON.parse(value) as HappySnapshot });
      else dispatch({ type: "HYDRATE", payload: { ...emptySnapshot(user.id), preferences: { ...DEFAULT_PREFERENCES, displayName: (user.user_metadata.display_name as string | undefined) ?? "Happy friend" } } });
      void claimPendingInvite().catch(() => undefined).finally(() => { if (active) void refresh(); });
    }).catch(() => { if (active) void claimPendingInvite().catch(() => undefined).finally(() => { if (active) void refresh(); }); });
    const channel = supabase.channel(`happyme-${user.id}`).on("postgres_changes", { event: "*", schema: "public" }, () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => { void refresh(); }, 240);
    }).subscribe();
    return () => { active = false; if (refreshTimer.current) clearTimeout(refreshTimer.current); void supabase.removeChannel(channel); };
  }, [refresh, user]);

  useEffect(() => { if (user && state.hydrated) AsyncStorage.setItem(`${CACHE_PREFIX}.${user.id}`, JSON.stringify(toSnapshot(state))).catch(() => undefined); }, [state, user]);

  const addMoment = useCallback(async (input: NewMomentInput) => {
    if (!user) throw new Error("Sign in to save a moment.");
    const id = Crypto.randomUUID(); const now = input.createdAt ?? new Date().toISOString();
    const moment: Moment = { id, text: input.text.trim(), mood: input.mood, authorId: user.id, podId: input.podId, tags: input.tags ?? [], createdAt: now, updatedAt: now, isFavorite: false, reactions: { smile: 0, heart: 0, celebrate: 0 } };
    dispatch({ type: "ADD_MOMENT", payload: moment });
    const { error } = await supabase.from("moments").insert({ id, author_id: user.id, pod_id: input.podId ?? null, body: moment.text, mood: moment.mood, tags: moment.tags, created_at: now, updated_at: now });
    if (error) { dispatch({ type: "SYNC_ERROR", payload: error.message }); void refresh(); throw new Error(error.message); }
    return id;
  }, [refresh, user]);

  const updateMoment = useCallback(async (id: string, input: Pick<NewMomentInput, "text" | "mood" | "podId">) => { dispatch({ type: "UPDATE_MOMENT", payload: { id, text: input.text.trim(), mood: input.mood, podId: input.podId } }); const { error } = await supabase.from("moments").update({ body: input.text.trim(), mood: input.mood, pod_id: input.podId ?? null }).eq("id", id); if (error) { void refresh(); throw new Error(error.message); } }, [refresh]);
  const deleteMoment = useCallback(async (id: string) => { dispatch({ type: "DELETE_MOMENT", payload: id }); const { error } = await supabase.from("moments").delete().eq("id", id); if (error) { void refresh(); throw new Error(error.message); } }, [refresh]);
  const toggleFavorite = useCallback(async (id: string) => { const next = !stateRef.current.moments.find((item) => item.id === id)?.isFavorite; dispatch({ type: "TOGGLE_FAVORITE", payload: id }); const { error } = await supabase.from("moments").update({ is_favorite: next }).eq("id", id); if (error) { void refresh(); throw new Error(error.message); } }, [refresh]);
  const reactToMoment = useCallback(async (id: string, reaction: ReactionKind) => {
    if (!user) return; const previous = stateRef.current.moments.find((item) => item.id === id)?.myReaction; dispatch({ type: "REACT", payload: { id, reaction } });
    const response = previous === reaction ? await supabase.from("moment_reactions").delete().eq("moment_id", id).eq("user_id", user.id) : await supabase.from("moment_reactions").upsert({ moment_id: id, user_id: user.id, kind: reaction }, { onConflict: "moment_id,user_id" });
    if (response.error) { void refresh(); throw new Error(response.error.message); }
  }, [refresh, user]);

  const createPod = useCallback(async (input: NewPodInput) => {
    if (!user) throw new Error("Sign in to create a pod.");
    const row = await requireData(supabase.rpc("create_pod", { p_name: input.name.trim(), p_description: input.description.trim(), p_color: input.color }));
    const source = row as unknown as Record<string, string>;
    const pod: Pod = { id: source.id, ownerId: source.owner_id, name: source.name, description: source.description, color: source.color, memberIds: [user.id], inviteCode: source.invite_code, inviteToken: source.invite_token, createdAt: source.created_at };
    dispatch({ type: "ADD_POD", payload: pod }); return pod;
  }, [user]);
  const joinPodByCode = useCallback(async (code: string) => { const { data, error } = await supabase.rpc("join_pod_by_code", { p_invite_code: code.trim() }); if (error || !data) return false; await refresh(); return true; }, [refresh]);
  const joinPodFromInvite = useCallback(async (invite: PodInvitePayload) => { const response = invite.inviteToken ? await supabase.rpc("claim_pod_invite", { p_invite_token: invite.inviteToken }) : await supabase.rpc("join_pod_by_code", { p_invite_code: invite.inviteCode }); if (response.error || !response.data) throw new Error(response.error?.message ?? "Invitation unavailable."); await refresh(); return response.data as string; }, [refresh]);
  const sendEncouragement = useCallback(async (input: NewEncouragementInput) => { if (!user) throw new Error("Sign in to send kindness."); const id = Crypto.randomUUID(); const createdAt = new Date().toISOString(); const item: Encouragement = { id, fromMemberId: user.id, toMemberId: input.toMemberId, podId: input.podId, message: input.message.trim(), createdAt, read: false }; dispatch({ type: "ADD_ENCOURAGEMENT", payload: item }); const { error } = await supabase.from("encouragements").insert({ id, sender_id: user.id, recipient_id: input.toMemberId, pod_id: input.podId ?? null, body: item.message, created_at: createdAt }); if (error) { void refresh(); throw new Error(error.message); } return id; }, [refresh, user]);
  const markEncouragementRead = useCallback(async (id: string) => { dispatch({ type: "READ_ENCOURAGEMENT", payload: id }); const { error } = await supabase.from("encouragements").update({ read_at: new Date().toISOString() }).eq("id", id); if (error) { void refresh(); throw new Error(error.message); } }, [refresh]);
  const updatePreferences = useCallback(async (input: Partial<Preferences>) => { if (!user) return; dispatch({ type: "UPDATE_PREFERENCES", payload: input }); const patch: Record<string, unknown> = {}; if (input.displayName !== undefined) { patch.display_name = input.displayName.trim(); } if (input.appearance !== undefined) patch.appearance = input.appearance; if (input.remindersEnabled !== undefined) patch.reminders_enabled = input.remindersEnabled; if (input.celebrationSounds !== undefined) patch.celebration_haptics = input.celebrationSounds; const { error } = await supabase.from("profiles").update(patch).eq("id", user.id); if (error) { void refresh(); throw new Error(error.message); } }, [refresh, user]);
  const resetData = useCallback(async () => { if (!user) return; dispatch({ type: "CLEAR_MOMENTS" }); const { error } = await supabase.from("moments").delete().eq("author_id", user.id); if (error) { void refresh(); throw new Error(error.message); } }, [refresh, user]);
  const exportSnapshot = useCallback(() => JSON.stringify(toSnapshot(stateRef.current), null, 2), []);

  const value = useMemo<HappyContextValue>(() => ({ state, refresh, addMoment, updateMoment, deleteMoment, toggleFavorite, reactToMoment, createPod, joinPodByCode, joinPodFromInvite, sendEncouragement, markEncouragementRead, updatePreferences, resetData, exportSnapshot }), [state, refresh, addMoment, updateMoment, deleteMoment, toggleFavorite, reactToMoment, createPod, joinPodByCode, joinPodFromInvite, sendEncouragement, markEncouragementRead, updatePreferences, resetData, exportSnapshot]);
  return <HappyContext.Provider value={value}>{children}</HappyContext.Provider>;
}

export function useHappy(): HappyContextValue { const value = useContext(HappyContext); if (!value) throw new Error("useHappy must be used inside HappyProvider"); return value; }
