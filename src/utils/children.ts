import type { AppState, ChildProfile } from "../types";
import { createDefaultChild, normalizeState, refreshTreasures } from "../storage";

const touchChild = (child: ChildProfile): ChildProfile => ({
  ...child,
  updatedAt: new Date().toISOString(),
});

export function getActiveChild(state: AppState): ChildProfile {
  return state.children.find((child) => child.id === state.activeChildId) ?? state.children[0] ?? createDefaultChild();
}

export function updateActiveChild(state: AppState, updater: (child: ChildProfile) => ChildProfile): AppState {
  const activeChild = getActiveChild(state);
  return normalizeState({
    ...state,
    children: state.children.map((child) => (
      child.id === activeChild.id ? touchChild(updater(child)) : child
    )),
    activeChildId: activeChild.id,
  });
}

export function addChild(state: AppState, name: string): AppState {
  const child = createDefaultChild(name);
  return normalizeState({
    ...state,
    children: [...state.children, child],
    activeChildId: child.id,
  });
}

export function renameChild(state: AppState, childId: string, name: string): AppState {
  const nextName = name.trim() || "プリンセス";
  return normalizeState({
    ...state,
    children: state.children.map((child) => (
      child.id === childId ? touchChild({ ...child, name: nextName }) : child
    )),
  });
}

export function deleteChild(state: AppState, childId: string): AppState {
  if (state.children.length <= 1) return state;
  const children = state.children.filter((child) => child.id !== childId);
  const activeChildId = state.activeChildId === childId ? children[0]?.id ?? state.activeChildId : state.activeChildId;
  return normalizeState({ ...state, children, activeChildId });
}

export function switchActiveChild(state: AppState, childId: string): AppState {
  if (!state.children.some((child) => child.id === childId)) return normalizeState(state);
  return normalizeState({ ...state, activeChildId: childId });
}

export function refreshChildTotals(child: ChildProfile): ChildProfile {
  const totalHanamaru = Math.max(0, child.totalHanamaru);
  return {
    ...child,
    totalHanamaru,
    treasures: refreshTreasures(child.treasures, totalHanamaru),
  };
}
