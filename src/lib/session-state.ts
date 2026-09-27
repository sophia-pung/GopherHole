import type { Me, AppState, Filters } from "./store";
import { defaultState } from "./store";

export function buildAppState(me: Me, filters: Filters, extras: Partial<AppState> = {}): AppState {
  return {
    ...defaultState,
    ...extras,
    me,
    filters,
    verified: extras.verified ?? true,
    onboarded: extras.onboarded ?? true,
  };
}
