import type { HappySnapshot, HappyState, Moment, Pod, Preferences, ReactionKind, Encouragement } from "@/lib/domain";

export type HappyAction =
  | { type: "HYDRATE"; payload: HappySnapshot }
  | { type: "SYNC_START" }
  | { type: "SYNC_SUCCESS"; payload: HappySnapshot }
  | { type: "SYNC_ERROR"; payload: string }
  | { type: "ADD_MOMENT"; payload: Moment }
  | { type: "UPDATE_MOMENT"; payload: { id: string; text: string; mood: Moment["mood"]; podId?: string } }
  | { type: "DELETE_MOMENT"; payload: string }
  | { type: "TOGGLE_FAVORITE"; payload: string }
  | { type: "REACT"; payload: { id: string; reaction: ReactionKind } }
  | { type: "ADD_POD"; payload: Pod }
  | { type: "JOIN_POD"; payload: string }
  | { type: "ADD_ENCOURAGEMENT"; payload: Encouragement }
  | { type: "READ_ENCOURAGEMENT"; payload: string }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<Preferences> }
  | { type: "CLEAR_MOMENTS" };

export function happyReducer(state: HappyState, action: HappyAction): HappyState {
  switch (action.type) {
    case "HYDRATE": return { ...state, ...action.payload, hydrated: true };
    case "SYNC_START": return { ...state, syncing: true, syncError: undefined };
    case "SYNC_SUCCESS": return { ...action.payload, hydrated: true, syncing: false, syncError: undefined };
    case "SYNC_ERROR": return { ...state, hydrated: true, syncing: false, syncError: action.payload };
    case "ADD_MOMENT": return { ...state, moments: [action.payload, ...state.moments.filter((item) => item.id !== action.payload.id)] };
    case "UPDATE_MOMENT": return { ...state, moments: state.moments.map((moment) => moment.id === action.payload.id ? { ...moment, ...action.payload, updatedAt: new Date().toISOString() } : moment) };
    case "DELETE_MOMENT": return { ...state, moments: state.moments.filter((moment) => moment.id !== action.payload) };
    case "TOGGLE_FAVORITE": return { ...state, moments: state.moments.map((moment) => moment.id === action.payload ? { ...moment, isFavorite: !moment.isFavorite } : moment) };
    case "REACT": return { ...state, moments: state.moments.map((moment) => {
      if (moment.id !== action.payload.id) return moment;
      const previous = moment.myReaction; const reactions = { ...moment.reactions };
      if (previous) reactions[previous] = Math.max(0, reactions[previous] - 1);
      if (previous === action.payload.reaction) return { ...moment, myReaction: undefined, reactions };
      reactions[action.payload.reaction] += 1;
      return { ...moment, myReaction: action.payload.reaction, reactions };
    }) };
    case "ADD_POD": return { ...state, pods: [action.payload, ...state.pods.filter((item) => item.id !== action.payload.id)] };
    case "JOIN_POD": return { ...state, pods: state.pods.map((pod) => pod.id === action.payload && !pod.memberIds.includes(state.currentMemberId) ? { ...pod, memberIds: [...pod.memberIds, state.currentMemberId] } : pod) };
    case "ADD_ENCOURAGEMENT": return { ...state, encouragements: [action.payload, ...state.encouragements.filter((item) => item.id !== action.payload.id)] };
    case "READ_ENCOURAGEMENT": return { ...state, encouragements: state.encouragements.map((item) => item.id === action.payload ? { ...item, read: true } : item) };
    case "UPDATE_PREFERENCES": return { ...state, preferences: { ...state.preferences, ...action.payload } };
    case "CLEAR_MOMENTS": return { ...state, moments: [] };
    default: return state;
  }
}

export function toSnapshot(state: HappyState): HappySnapshot {
  return { schemaVersion: 1, currentMemberId: state.currentMemberId, moments: state.moments, pods: state.pods, members: state.members, encouragements: state.encouragements, preferences: state.preferences };
}
