export type RoutineSlot = "morning" | "evening";

export const ROUTINE_SLOTS: RoutineSlot[] = ["morning", "evening"];

export const PROFILE_COLORS = ["lilac", "berry", "sky", "mint", "sunset", "citrus"] as const;
export type ProfileColor = (typeof PROFILE_COLORS)[number];

export interface Task {
  id: string;
  label: string;
  arasaacId: number | null;
  emoji: string;
}

export interface Routine {
  tasks: Task[];
}

export interface ProfileAvatar {
  arasaacId: number | null;
  emoji: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: ProfileAvatar;
  color: ProfileColor;
  routines: Record<RoutineSlot, Routine>;
}

export interface AppConfig {
  schemaVersion: 2;
  profiles: Profile[];
  pin: { hash: string; salt: string } | null;
  failedAttempts: number;
  lockedUntil: number | null;
}

export interface ChecksState {
  schemaVersion: 2;
  entries: Record<string, Record<string, boolean>>;
}

export function checksKey(profileId: string, slot: RoutineSlot, date: string): string {
  return `${profileId}:${slot}:${date}`;
}

export function emptyConfig(): AppConfig {
  return {
    schemaVersion: 2,
    profiles: [],
    pin: null,
    failedAttempts: 0,
    lockedUntil: null,
  };
}

export function emptyChecks(): ChecksState {
  return { schemaVersion: 2, entries: {} };
}
