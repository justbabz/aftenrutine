export type RoutineSlot = "morning" | "evening";

export const ROUTINE_SLOTS: RoutineSlot[] = ["morning", "evening"];

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const WEEKDAY_LABELS: Record<Weekday, { full: string; short: string }> = {
  mon: { full: "Mandag",  short: "Man" },
  tue: { full: "Tirsdag", short: "Tir" },
  wed: { full: "Onsdag",  short: "Ons" },
  thu: { full: "Torsdag", short: "Tor" },
  fri: { full: "Fredag",  short: "Fre" },
  sat: { full: "Lørdag",  short: "Lør" },
  sun: { full: "Søndag",  short: "Søn" },
};

const JS_DAY_TO_WEEKDAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function weekdayFromDate(d: Date = new Date()): Weekday {
  return JS_DAY_TO_WEEKDAY[d.getDay()];
}

export const PROFILE_COLORS = [
  "ruby", "sunset", "amber", "citrus", "mint", "sky",
  "ocean", "lilac", "plum", "berry", "cocoa", "slate",
] as const;
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

export type WeeklyRoutine = Record<Weekday, Routine>;

export interface ProfileAvatar {
  arasaacId: number | null;
  emoji: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: ProfileAvatar;
  color: ProfileColor;
  routines: Record<RoutineSlot, WeeklyRoutine>;
}

export interface AppConfig {
  schemaVersion: 3;
  profiles: Profile[];
  pin: { hash: string; salt: string } | null;
  failedAttempts: number;
  lockedUntil: number | null;
  familyName?: string;
}

export interface ChecksState {
  schemaVersion: 2;
  entries: Record<string, Record<string, boolean>>;
}

export function checksKey(profileId: string, slot: RoutineSlot, date: string): string {
  return `${profileId}:${slot}:${date}`;
}

export function emptyWeeklyRoutine(): WeeklyRoutine {
  return {
    mon: { tasks: [] },
    tue: { tasks: [] },
    wed: { tasks: [] },
    thu: { tasks: [] },
    fri: { tasks: [] },
    sat: { tasks: [] },
    sun: { tasks: [] },
  };
}

export function emptyConfig(): AppConfig {
  return {
    schemaVersion: 3,
    profiles: [],
    pin: null,
    failedAttempts: 0,
    lockedUntil: null,
  };
}

export function emptyChecks(): ChecksState {
  return { schemaVersion: 2, entries: {} };
}
