import type { AppState, DailyRecord, PromiseItem, StickerDesign, Treasure } from "./types";
import { getCurrentPrincessGrowth } from "./utils/princessGrowth";

export const STORAGE_KEY = "kirakira-princess-app-v1";

const nowIso = (): string => new Date().toISOString();

export const defaultPromises: PromiseItem[] = [
  { id: "promise-tooth", title: "はみがき", hanamaru: 1, enabled: true, createdAt: nowIso() },
  { id: "promise-clothes", title: "おきがえ", hanamaru: 1, enabled: true, createdAt: nowIso() },
  { id: "promise-cleanup", title: "おかたづけ", hanamaru: 1, enabled: true, createdAt: nowIso() },
  { id: "promise-meal", title: "ごはんをたべる", hanamaru: 1, enabled: true, createdAt: nowIso() },
  { id: "promise-kind", title: "やさしくできた", hanamaru: 1, enabled: true, createdAt: nowIso() },
];

export const defaultTreasures: Treasure[] = [
  { id: "treasure-seal", name: "きらきらシール", requiredHanamaru: 5, unlocked: false, emoji: "✨" },
  { id: "treasure-ribbon", name: "ピンクのリボン", requiredHanamaru: 10, unlocked: false, emoji: "🎀" },
  { id: "treasure-wand", name: "まほうのステッキ", requiredHanamaru: 20, unlocked: false, emoji: "🪄" },
  { id: "treasure-dress", name: "プリンセスドレス", requiredHanamaru: 30, unlocked: false, emoji: "👗" },
  { id: "treasure-tiara", name: "でんせつのティアラ", requiredHanamaru: 50, unlocked: false, emoji: "👑" },
  { id: "treasure-wall", name: "おしろのかべがみ", requiredHanamaru: 75, unlocked: false, emoji: "🏰" },
  { id: "treasure-castle", name: "ゆめのおしろ", requiredHanamaru: 100, unlocked: false, emoji: "💖" },
];

export const defaultStickerDesigns: StickerDesign[] = [
  { type: "hanamaru", emoji: "💮", label: "がんばったはなまる" },
  { type: "rainbow", emoji: "🌈", label: "きらきらはなまる" },
  { type: "crown", emoji: "👑", label: "プリンセスはなまる" },
  { type: "diamond", emoji: "💎", label: "ダイヤはなまる" },
  { type: "ribbon", emoji: "🎀", label: "やさしさリボン" },
];

export function createInitialState(): AppState {
  return {
    promises: defaultPromises,
    records: [],
    treasures: refreshTreasures(defaultTreasures, 0),
    stickers: [],
    stickerDesigns: defaultStickerDesigns,
    princessImages: {},
    totalHanamaru: 0,
    childName: "プリンセス",
    lastKnownLevel: 1,
  };
}

export function refreshTreasures(treasures: Treasure[], totalHanamaru: number): Treasure[] {
  return treasures.map((treasure) => ({
    ...treasure,
    unlocked: totalHanamaru >= treasure.requiredHanamaru,
  }));
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as unknown;
    return migrateState(parsed);
  } catch (error) {
    console.warn("保存データを読みこめませんでした。", error);
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("保存できませんでした。画像が大きい可能性があります。", error);
  }
}

export function migrateState(value: unknown): AppState {
  if (!value || typeof value !== "object") return createInitialState();
  const source = value as Record<string, unknown>;
  const initial = createInitialState();

  const totalHanamaru = toNumber(source.totalHanamaru ?? source.totalStars, 0);
  const promises = migratePromises(source.promises) ?? initial.promises;
  const records = migrateRecords(source.records);
  const stickerDesigns = mergeStickerDesigns(source.stickerDesigns);
  const treasures = migrateTreasures(source.treasures, totalHanamaru);
  const lastKnownLevel = toNumber(source.lastKnownLevel, getCurrentPrincessGrowth(totalHanamaru).level);

  return {
    promises,
    records,
    treasures,
    stickers: Array.isArray(source.stickers) ? source.stickers.filter(Boolean) as AppState["stickers"] : [],
    stickerDesigns,
    princessImages: isRecord(source.princessImages) ? source.princessImages as Record<number, string | undefined> : {},
    totalHanamaru,
    childName: typeof source.childName === "string" && source.childName.trim() ? source.childName : initial.childName,
    lastKnownLevel,
  };
}

function migratePromises(value: unknown): PromiseItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const promises = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return undefined;
      const source = item as Record<string, unknown>;
      const title = typeof source.title === "string" && source.title.trim() ? source.title.trim() : undefined;
      if (!title) return undefined;
      return {
        id: typeof source.id === "string" ? source.id : `promise-${index}`,
        title,
        hanamaru: Math.max(1, toNumber(source.hanamaru ?? source.star, 1)),
        enabled: typeof source.enabled === "boolean" ? source.enabled : true,
        createdAt: typeof source.createdAt === "string" ? source.createdAt : nowIso(),
      };
    })
    .filter((item): item is PromiseItem => Boolean(item));
  return promises.length > 0 ? promises : undefined;
}

function migrateRecords(value: unknown): DailyRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const source = item as Record<string, unknown>;
      if (typeof source.date !== "string") return undefined;
      return {
        date: source.date,
        completedPromiseIds: Array.isArray(source.completedPromiseIds)
          ? source.completedPromiseIds.filter((id): id is string => typeof id === "string")
          : [],
        earnedHanamaru: Math.max(0, toNumber(source.earnedHanamaru ?? source.earnedStars, 0)),
      };
    })
    .filter((record): record is DailyRecord => Boolean(record));
}

function migrateTreasures(value: unknown, totalHanamaru: number): Treasure[] {
  if (!Array.isArray(value)) return refreshTreasures(defaultTreasures, totalHanamaru);
  const byId = new Map(value.filter(isRecord).map((item) => [String(item.id), item]));
  return refreshTreasures(defaultTreasures.map((treasure) => {
    const saved = byId.get(treasure.id);
    return saved && typeof saved.name === "string" ? { ...treasure, name: saved.name } : treasure;
  }), totalHanamaru);
}

function mergeStickerDesigns(value: unknown): StickerDesign[] {
  if (!Array.isArray(value)) return defaultStickerDesigns;
  return defaultStickerDesigns.map((design) => {
    const saved = value.find((item) => isRecord(item) && item.type === design.type);
    if (!isRecord(saved)) return design;
    return {
      ...design,
      imageDataUrl: typeof saved.imageDataUrl === "string" ? saved.imageDataUrl : undefined,
    };
  });
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
