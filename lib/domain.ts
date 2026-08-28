export type Mood = "sunny" | "peaceful" | "proud" | "connected";
export type ReactionKind = "smile" | "heart" | "celebrate";
export type AppearancePreference = "system" | "light" | "dark";

export interface Member { id: string; name: string; initials: string; color: string }
export interface Pod { id: string; name: string; description: string; color: string; memberIds: string[]; inviteCode: string; createdAt: string }
export interface MomentReactionCounts { smile: number; heart: number; celebrate: number }
export interface Moment {
  id: string; text: string; mood: Mood; authorId: string; podId?: string; tags: string[]; createdAt: string; updatedAt: string;
  isFavorite: boolean; myReaction?: ReactionKind; reactions: MomentReactionCounts;
}
export interface Encouragement { id: string; fromMemberId: string; toMemberId: string; podId?: string; message: string; createdAt: string; read: boolean }
export interface Preferences { appearance: AppearancePreference; remindersEnabled: boolean; celebrationSounds: boolean; displayName: string }
export interface HappySnapshot {
  schemaVersion: 1; currentMemberId: string; moments: Moment[]; pods: Pod[]; members: Member[]; encouragements: Encouragement[]; preferences: Preferences;
}
export interface HappyState extends HappySnapshot { hydrated: boolean }
export interface NewMomentInput { text: string; mood: Mood; podId?: string; createdAt?: string; tags?: string[] }
export interface NewPodInput { name: string; description: string; color: string }
export interface NewEncouragementInput { toMemberId: string; message: string; podId?: string }
