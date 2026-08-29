import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type { Encouragement, HappySnapshot, HappyState, Moment, NewEncouragementInput, NewMomentInput, NewPodInput, Pod, Preferences, ReactionKind } from "@/lib/domain";
import type { PodInvitePayload } from "@/lib/pod-invites";
import { createSeedSnapshot } from "@/lib/seed";

const STORAGE_KEY = "happyme.snapshot.v1";
type Action =
  | { type: "HYDRATE"; payload: HappySnapshot } | { type: "ADD_MOMENT"; payload: Moment }
  | { type: "UPDATE_MOMENT"; payload: { id: string; text: string; mood: Moment["mood"]; podId?: string } }
  | { type: "DELETE_MOMENT"; payload: string } | { type: "TOGGLE_FAVORITE"; payload: string }
  | { type: "REACT"; payload: { id: string; reaction: ReactionKind } } | { type: "ADD_POD"; payload: Pod }
  | { type: "JOIN_POD"; payload: string } | { type: "ADD_ENCOURAGEMENT"; payload: Encouragement }
  | { type: "READ_ENCOURAGEMENT"; payload: string } | { type: "UPDATE_PREFERENCES"; payload: Partial<Preferences> }
  | { type: "RESET"; payload: HappySnapshot };

function initialState(): HappyState { return { ...createSeedSnapshot(), hydrated: false }; }

function reducer(state: HappyState, action: Action): HappyState {
  switch (action.type) {
    case "HYDRATE": return { ...action.payload, hydrated: true };
    case "ADD_MOMENT": return { ...state, moments: [action.payload, ...state.moments] };
    case "UPDATE_MOMENT": return { ...state, moments: state.moments.map((moment) => moment.id === action.payload.id ? { ...moment, ...action.payload, updatedAt: new Date().toISOString() } : moment) };
    case "DELETE_MOMENT": return { ...state, moments: state.moments.filter((moment) => moment.id !== action.payload) };
    case "TOGGLE_FAVORITE": return { ...state, moments: state.moments.map((moment) => moment.id === action.payload ? { ...moment, isFavorite: !moment.isFavorite } : moment) };
    case "REACT": return { ...state, moments: state.moments.map((moment) => {
      if (moment.id !== action.payload.id) return moment;
      const previous = moment.myReaction;
      const reactions = { ...moment.reactions };
      if (previous) reactions[previous] = Math.max(0, reactions[previous] - 1);
      if (previous === action.payload.reaction) return { ...moment, myReaction: undefined, reactions };
      reactions[action.payload.reaction] += 1;
      return { ...moment, myReaction: action.payload.reaction, reactions };
    }) };
    case "ADD_POD": return { ...state, pods: [action.payload, ...state.pods] };
    case "JOIN_POD": return { ...state, pods: state.pods.map((pod) => pod.id === action.payload && !pod.memberIds.includes(state.currentMemberId) ? { ...pod, memberIds: [...pod.memberIds, state.currentMemberId] } : pod) };
    case "ADD_ENCOURAGEMENT": return { ...state, encouragements: [action.payload, ...state.encouragements] };
    case "READ_ENCOURAGEMENT": return { ...state, encouragements: state.encouragements.map((item) => item.id === action.payload ? { ...item, read: true } : item) };
    case "UPDATE_PREFERENCES": return { ...state, preferences: { ...state.preferences, ...action.payload } };
    case "RESET": return { ...action.payload, hydrated: true };
    default: return state;
  }
}

function makeId(prefix: string): string { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function toSnapshot(state: HappyState): HappySnapshot { const { hydrated: _hydrated, ...snapshot } = state; return snapshot; }

interface HappyContextValue {
  state: HappyState; addMoment: (input: NewMomentInput) => string;
  updateMoment: (id: string, input: Pick<NewMomentInput, "text" | "mood" | "podId">) => void;
  deleteMoment: (id: string) => void; toggleFavorite: (id: string) => void; reactToMoment: (id: string, reaction: ReactionKind) => void;
  createPod: (input: NewPodInput) => Pod; joinPodByCode: (code: string) => boolean; joinPodFromInvite: (invite: PodInvitePayload) => string;
  sendEncouragement: (input: NewEncouragementInput) => string; markEncouragementRead: (id: string) => void;
  updatePreferences: (input: Partial<Preferences>) => void; resetData: () => void; exportSnapshot: () => string;
}

const HappyContext = createContext<HappyContextValue | null>(null);

export function HappyProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!active) return;
      const parsed = value ? JSON.parse(value) as HappySnapshot : createSeedSnapshot();
      dispatch({ type: "HYDRATE", payload: parsed.schemaVersion === 1 ? parsed : createSeedSnapshot() });
    }).catch(() => { if (active) dispatch({ type: "HYDRATE", payload: createSeedSnapshot() }); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (state.hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSnapshot(state))).catch(() => undefined); }, [state]);

  const addMoment = useCallback((input: NewMomentInput) => {
    const id = makeId("moment"); const now = input.createdAt ?? new Date().toISOString();
    dispatch({ type: "ADD_MOMENT", payload: { id, text: input.text.trim(), mood: input.mood, authorId: state.currentMemberId, podId: input.podId, tags: input.tags ?? [], createdAt: now, updatedAt: now, isFavorite: false, reactions: { smile: 0, heart: 0, celebrate: 0 } } });
    return id;
  }, [state.currentMemberId]);
  const updateMoment = useCallback((id: string, input: Pick<NewMomentInput, "text" | "mood" | "podId">) => dispatch({ type: "UPDATE_MOMENT", payload: { id, text: input.text.trim(), mood: input.mood, podId: input.podId } }), []);
  const deleteMoment = useCallback((id: string) => dispatch({ type: "DELETE_MOMENT", payload: id }), []);
  const toggleFavorite = useCallback((id: string) => dispatch({ type: "TOGGLE_FAVORITE", payload: id }), []);
  const reactToMoment = useCallback((id: string, reaction: ReactionKind) => dispatch({ type: "REACT", payload: { id, reaction } }), []);
  const createPod = useCallback((input: NewPodInput) => {
    const pod: Pod = { id: makeId("pod"), name: input.name.trim(), description: input.description.trim(), color: input.color, memberIds: [state.currentMemberId], inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: new Date().toISOString() };
    dispatch({ type: "ADD_POD", payload: pod });
    return pod;
  }, [state.currentMemberId]);
  const joinPodByCode = useCallback((code: string) => { const match = state.pods.find((pod) => pod.inviteCode === code.trim().toUpperCase()); if (!match) return false; dispatch({ type: "JOIN_POD", payload: match.id }); return true; }, [state.pods]);
  const joinPodFromInvite = useCallback((invite: PodInvitePayload) => {
    const existing = state.pods.find((pod) => pod.id === invite.podId || pod.inviteCode === invite.inviteCode);
    if (existing) { dispatch({ type: "JOIN_POD", payload: existing.id }); return existing.id; }
    const pod: Pod = { id: invite.podId, name: invite.name, description: invite.description, color: invite.color, memberIds: [state.currentMemberId], inviteCode: invite.inviteCode, createdAt: new Date().toISOString() };
    dispatch({ type: "ADD_POD", payload: pod });
    return pod.id;
  }, [state.currentMemberId, state.pods]);
  const sendEncouragement = useCallback((input: NewEncouragementInput) => {
    const id = makeId("encouragement"); dispatch({ type: "ADD_ENCOURAGEMENT", payload: { id, fromMemberId: state.currentMemberId, toMemberId: input.toMemberId, podId: input.podId, message: input.message.trim(), createdAt: new Date().toISOString(), read: true } }); return id;
  }, [state.currentMemberId]);
  const markEncouragementRead = useCallback((id: string) => dispatch({ type: "READ_ENCOURAGEMENT", payload: id }), []);
  const updatePreferences = useCallback((input: Partial<Preferences>) => dispatch({ type: "UPDATE_PREFERENCES", payload: input }), []);
  const resetData = useCallback(() => dispatch({ type: "RESET", payload: createSeedSnapshot() }), []);
  const exportSnapshot = useCallback(() => JSON.stringify(toSnapshot(state), null, 2), [state]);
  const value = useMemo(() => ({ state, addMoment, updateMoment, deleteMoment, toggleFavorite, reactToMoment, createPod, joinPodByCode, joinPodFromInvite, sendEncouragement, markEncouragementRead, updatePreferences, resetData, exportSnapshot }), [state, addMoment, updateMoment, deleteMoment, toggleFavorite, reactToMoment, createPod, joinPodByCode, joinPodFromInvite, sendEncouragement, markEncouragementRead, updatePreferences, resetData, exportSnapshot]);
  return <HappyContext.Provider value={value}>{children}</HappyContext.Provider>;
}

export function useHappy(): HappyContextValue { const value = useContext(HappyContext); if (!value) throw new Error("useHappy must be used inside HappyProvider"); return value; }
export { reducer as happyReducer, toSnapshot };
