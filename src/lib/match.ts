import type { Student } from "./data";
import type { AppState } from "./store";

function myBudgetMax(s: AppState): number {
  return s.me.budgetMax || 1400;
}

export function passesFilters(st: Student, s: AppState): boolean {
  const f = s.filters;
  if (s.blocked.includes(st.id)) return false;
  if (f.housing !== "Any" && st.housing !== f.housing) return false;
  if (f.neighborhood !== "Any" && !st.neighborhoods.includes(f.neighborhood)) return false;
  if (f.year !== "Any" && st.year !== f.year) return false;
  if (st.budgetMin > myBudgetMax(s)) return false;
  if (f.major !== "Any" && st.major !== f.major) return false;
  if (f.state !== "Any" && !st.hometown.endsWith(f.state) && st.hometown !== f.state) return false;
  if (s.me.housing === "Dorm" && st.housing !== "Dorm") return false;
  if (s.me.housing === "Apartment" && st.housing !== "Apartment") return false;
  if (s.me.housing === "Subletting my place" && st.housing === "Dorm") return false;
  if (f.intent !== "Any" && st.intent !== f.intent) return false;
  if (f.needsSubleaser && !st.lookingForSubleaser) return false;
  return true;
}

/**
 * Jev ranking: housing + location + budget + dates + year + intent.
 * Discover = published profiles except me and already-swiped, ordered by this score.
 */
export function compatibility(st: Student, s: AppState): { score: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 40;

  if (s.me.housing && st.housing === s.me.housing) {
    score += 18;
    reasons.push(`Both looking for: ${st.housing.toLowerCase()}`);
  }
  const overlap = st.neighborhoods.filter((n) => s.me.neighborhoods.includes(n));
  if (overlap.length) {
    score += 15;
    reasons.push(`Both want ${overlap[0]}`);
  }
  if (st.budgetMin <= myBudgetMax(s)) {
    score += 12;
    reasons.push("Same budget band");
  }
  if (s.me.year && st.year === s.me.year) {
    score += 8;
    reasons.push(`Both ${st.year.toLowerCase()}s`);
  }
  if (s.me.intent && st.intent === s.me.intent) {
    score += 10;
    reasons.push("Same reason for looking");
  }
  if (st.moveIn && s.me.moveIn && st.moveIn === s.me.moveIn) {
    score += 7;
    reasons.push(`Both moving in ${st.moveIn}`);
  }

  if (st.cleanliness === "Lived-in") warnings.push("Different cleaning styles — talk before signing");
  if (st.sleep === "Night owl") warnings.push("Night owl — agree on quiet hours");

  return { score: Math.min(99, score), reasons: reasons.slice(0, 3), warnings: warnings.slice(0, 2) };
}

export function deckFrom(students: Student[], s: AppState): Student[] {
  return students
    .filter((st) => passesFilters(st, s) && !s.liked.includes(st.id) && !s.skipped.includes(st.id))
    .sort((a, b) => compatibility(b, s).score - compatibility(a, s).score);
}

export function deck(s: AppState, students: Student[] = []): Student[] {
  return deckFrom(students, s);
}

export function topPick(s: AppState, students: Student[] = []): Student | undefined {
  return deckFrom(students, s)[0];
}

export function isMutualNumberOne(st: Student, s: AppState, students: Student[] = []): boolean {
  return topPick(s, students)?.id === st.id;
}
