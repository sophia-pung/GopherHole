import { useSyncExternalStore } from "react";
import type { HousingType, Intent, Neighborhood } from "./data";

export interface ChatMessage {
  from: "me" | "them";
  text: string;
  at: number;
}

export interface Filters {
  housing: HousingType | "Any";
  neighborhood: Neighborhood | "Any";
  year: string;
  budgetMax: number;
  intent: Intent | "Any";
  major: string;
  state: string;
  needsSubleaser: boolean;
}

export interface Me {
  email: string;
  firstName: string;
  preferredName: string;
  age: string;
  year: string;
  major: string;
  housing: string;
  neighborhoods: string[];
  budget: string;
  budgetMin: number;
  budgetMax: number;
  dorms: string[];
  address: string;
  mapCenter: [number, number];
  radiusMi: number;
  roommates: number;
  homeState: string;
  spotifyTrack: string;
  moveIn: string;
  parking: string;
  household: string;
  intent: string;
  prompts: { prompt: string; answer: string }[];
  socials: Record<string, string>;
  spotifyConnected: boolean;
}

export interface AppState {
  verified: boolean;
  onboarded: boolean;
  me: Me;
  liked: string[];
  skipped: string[];
  matches: string[];
  threads: Record<string, ChatMessage[]>;
  blocked: string[];
  filters: Filters;
}

const KEY = "gopherhole.filters.v1";

export const defaultFilters: Filters = {
  housing: "Any",
  neighborhood: "Any",
  year: "Any",
  budgetMax: 2000,
  intent: "Any",
  major: "Any",
  state: "Any",
  needsSubleaser: false,
};

export const defaultMe: Me = {
  email: "",
  firstName: "",
  preferredName: "",
  age: "",
  year: "",
  major: "",
  housing: "",
  neighborhoods: [],
  budget: "",
  budgetMin: 600,
  budgetMax: 1200,
  dorms: [],
  address: "",
  mapCenter: [44.9765, -93.2352],
  radiusMi: 1,
  roommates: 1,
  homeState: "",
  spotifyTrack: "",
  moveIn: "",
  parking: "",
  household: "",
  intent: "",
  prompts: [],
  socials: {},
  spotifyConnected: false,
};

export const defaultState: AppState = {
  verified: false,
  onboarded: false,
  me: defaultMe,
  liked: [],
  skipped: [],
  matches: [],
  threads: {},
  blocked: [],
  filters: defaultFilters,
};

let filters: Filters = defaultFilters;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) filters = { ...defaultFilters, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function setFilters(update: (f: Filters) => Filters) {
  hydrate();
  filters = update(filters);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(filters));
  } catch {
    /* storage full or unavailable */
  }
  emit();
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFilters(): Filters {
  return useSyncExternalStore(
    subscribe,
    () => {
      hydrate();
      return filters;
    },
    () => defaultFilters,
  );
}

/** Filters only. Auth, profile, swipes, matches, and messages live in Supabase. */
export function setState(update: (s: AppState) => AppState) {
  const next = update({ ...defaultState, filters });
  setFilters(() => next.filters);
}

export function useAppState(): AppState {
  const f = useFilters();
  return { ...defaultState, filters: f };
}

export function resetApp() {
  setFilters(() => ({ ...defaultFilters }));
}
