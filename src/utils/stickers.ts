import type { PromiseItem, Sticker, StickerDesign, StickerType } from "../types";

export function createStickerForPromise(
  date: string,
  promise: PromiseItem,
  type: StickerType,
  design: StickerDesign,
): Sticker {
  return {
    id: `${date}-${promise.id}-${type}`,
    date,
    type,
    label: design.label,
    reason: design.label,
    promiseId: promise.id,
    promiseTitle: promise.title,
    createdAt: new Date().toISOString(),
  };
}

export function upsertStickerForPromise(stickers: Sticker[], sticker: Sticker): Sticker[] {
  const filtered = removeStickerForPromise(stickers, sticker.date, sticker.promiseId);
  return [...filtered, sticker].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function removeStickerForPromise(stickers: Sticker[], date: string, promiseId: string): Sticker[] {
  return stickers.filter((sticker) => !(sticker.date === date && sticker.promiseId === promiseId));
}

export function getStickerForPromise(stickers: Sticker[], date: string, promiseId: string): Sticker | undefined {
  return stickers.find((sticker) => sticker.date === date && sticker.promiseId === promiseId);
}
