import type { PrincessGrowth } from "../types";

export const princessGrowths: PrincessGrowth[] = [
  { level: 1, title: "はじまりのプリンセス", emoji: "👧", requiredHanamaru: 0, nextRequiredHanamaru: 5 },
  { level: 2, title: "きらきらプリンセス", emoji: "👧✨", requiredHanamaru: 5, nextRequiredHanamaru: 15 },
  { level: 3, title: "まほうのプリンセス", emoji: "🪄👧✨", requiredHanamaru: 15, nextRequiredHanamaru: 30 },
  { level: 4, title: "おしろのプリンセス", emoji: "🏰👸", requiredHanamaru: 30, nextRequiredHanamaru: 50 },
  { level: 5, title: "ティアラプリンセス", emoji: "👑👸✨", requiredHanamaru: 50 },
];

export function getCurrentPrincessGrowth(totalHanamaru: number): PrincessGrowth {
  return [...princessGrowths].reverse().find((growth) => totalHanamaru >= growth.requiredHanamaru) ?? princessGrowths[0];
}

export function getNextPrincessGrowth(totalHanamaru: number): PrincessGrowth | undefined {
  return princessGrowths.find((growth) => growth.requiredHanamaru > totalHanamaru);
}

export function getHanamaruToNextPrincessLevel(totalHanamaru: number): number {
  const next = getNextPrincessGrowth(totalHanamaru);
  return next ? Math.max(0, next.requiredHanamaru - totalHanamaru) : 0;
}

export function getPrincessLevelProgress(totalHanamaru: number): number {
  const current = getCurrentPrincessGrowth(totalHanamaru);
  const next = getNextPrincessGrowth(totalHanamaru);
  if (!next) return 100;
  const span = next.requiredHanamaru - current.requiredHanamaru;
  const currentProgress = totalHanamaru - current.requiredHanamaru;
  return Math.min(100, Math.max(0, Math.round((currentProgress / span) * 100)));
}
