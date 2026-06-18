import type { AppState, DailyRecord, Sticker, StickerType } from "../types";
import { addDays } from "./date";

const stickerLabels: Record<StickerType, { label: string; reason: string }> = {
  hanamaru: { label: "がんばったはなまる", reason: "1こ できたよ" },
  rainbow: { label: "きらきらはなまる", reason: "はんぶん できたよ" },
  crown: { label: "プリンセスはなまる", reason: "ぜんぶ できたよ" },
  diamond: { label: "ダイヤはなまる", reason: "3にち きらきら" },
  ribbon: { label: "やさしさリボン", reason: "やさしくできたよ" },
};

export function getStickerRules(): Record<StickerType, { label: string; reason: string }> {
  return stickerLabels;
}

export function createSticker(date: string, type: StickerType): Sticker {
  const rule = stickerLabels[type];
  return {
    id: `${date}-${type}`,
    date,
    type,
    label: rule.label,
    reason: rule.reason,
    createdAt: new Date().toISOString(),
  };
}

export function hasThreeDayStreak(records: DailyRecord[], targetDate: string): boolean {
  return [targetDate, addDays(targetDate, -1), addDays(targetDate, -2)].every((date) => {
    const record = records.find((item) => item.date === date);
    return Boolean(record && record.completedPromiseIds.length > 0);
  });
}

export function recalculateStickers(state: AppState, date: string): Sticker[] {
  const record = state.records.find((item) => item.date === date);
  const enabledPromises = state.promises.filter((item) => item.enabled);
  const completedIds = record?.completedPromiseIds ?? [];
  const completedEnabled = enabledPromises.filter((item) => completedIds.includes(item.id));
  const types = new Set<StickerType>();

  if (completedEnabled.length >= 1) types.add("hanamaru");
  if (enabledPromises.length > 0 && completedEnabled.length >= Math.ceil(enabledPromises.length / 2)) types.add("rainbow");
  if (enabledPromises.length > 0 && completedEnabled.length === enabledPromises.length) types.add("crown");
  if (hasThreeDayStreak(state.records, date)) types.add("diamond");
  if (completedEnabled.some((item) => item.title.includes("やさしく"))) types.add("ribbon");

  const datesToRefresh = new Set([date, addDays(date, 1), addDays(date, 2)]);
  const kept = state.stickers.filter((sticker) => !datesToRefresh.has(sticker.date));
  const recalculated = Array.from(datesToRefresh).flatMap((refreshDate) => {
    if (refreshDate !== date) {
      const nextState = { ...state, stickers: [] };
      return recalculateSingleDay(nextState, refreshDate);
    }
    return Array.from(types).map((type) => createSticker(date, type));
  });

  return [...kept, ...recalculated].sort((a, b) => b.date.localeCompare(a.date));
}

function recalculateSingleDay(state: AppState, date: string): Sticker[] {
  const record = state.records.find((item) => item.date === date);
  const enabledPromises = state.promises.filter((item) => item.enabled);
  const completedIds = record?.completedPromiseIds ?? [];
  const completedEnabled = enabledPromises.filter((item) => completedIds.includes(item.id));
  const types = new Set<StickerType>();

  if (completedEnabled.length >= 1) types.add("hanamaru");
  if (enabledPromises.length > 0 && completedEnabled.length >= Math.ceil(enabledPromises.length / 2)) types.add("rainbow");
  if (enabledPromises.length > 0 && completedEnabled.length === enabledPromises.length) types.add("crown");
  if (hasThreeDayStreak(state.records, date)) types.add("diamond");
  if (completedEnabled.some((item) => item.title.includes("やさしく"))) types.add("ribbon");

  return Array.from(types).map((type) => createSticker(date, type));
}
