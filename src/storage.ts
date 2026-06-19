import type { AppState, ChildProfile, DailyRecord, PromiseItem, Sticker, StickerDesign, Treasure } from "./types";
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

export function createDefaultChild(name = "プリンセス"): ChildProfile {
  const now = nowIso();
  return {
    id: `child-${crypto.randomUUID()}`,
    name: name.trim() || "プリンセス",
    promises: defaultPromises.map((item) => ({ ...item, createdAt: now })),
    records: [],
    treasures: refreshTreasures(defaultTreasures, 0),
    stickers: [],
    princessImages: {},
    totalHanamaru: 0,
    lastKnownLevel: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialState(): AppState {
  const child = createDefaultChild();
  return {
    children: [child],
    activeChildId: child.id,
    stickerDesigns: defaultStickerDesigns,
    appVersion: 2,
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripImageDataUrls(normalizeState(state))));
  } catch (error) {
    console.warn("保存できませんでした。", error);
  }
}

export function migrateState(value: unknown): AppState {
  if (!value || typeof value !== "object") return createInitialState();
  const source = value as Record<string, unknown>;

  if (source.appVersion === 2 && Array.isArray(source.children)) {
    return normalizeState({
      children: source.children.map((child) => migrateChild(child)),
      activeChildId: typeof source.activeChildId === "string" ? source.activeChildId : "",
      stickerDesigns: mergeStickerDesigns(source.stickerDesigns),
      appVersion: 2,
    });
  }

  return migrateOldState(source);
}

export function normalizeState(state: AppState): AppState {
  const children = state.children.map((child) => {
    const safeTotal = Math.max(0, child.totalHanamaru);
    return {
      ...child,
      name: child.name.trim() || "プリンセス",
      totalHanamaru: safeTotal,
      treasures: refreshTreasures(child.treasures, safeTotal),
      stickers: child.stickers.map(migrateSticker).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
      updatedAt: child.updatedAt || nowIso(),
    };
  }).filter((child) => child.id && child.name);

  const fallback = children.length > 0 ? children : [createDefaultChild()];
  const activeChildId = fallback.some((child) => child.id === state.activeChildId) ? state.activeChildId : fallback[0].id;

  return {
    children: fallback,
    activeChildId,
    stickerDesigns: mergeStickerDesigns(state.stickerDesigns),
    appVersion: 2,
  };
}

function migrateOldState(source: Record<string, unknown>): AppState {
  const totalHanamaru = Math.max(0, toNumber(source.totalHanamaru ?? source.totalStars, 0));
  const child = migrateChild({
    id: `child-${crypto.randomUUID()}`,
    name: typeof source.childName === "string" && source.childName.trim() ? source.childName : "プリンセス",
    promises: source.promises,
    records: source.records,
    treasures: source.treasures,
    stickers: source.stickers,
    princessImages: source.princessImages,
    totalHanamaru,
    lastKnownLevel: source.lastKnownLevel,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return normalizeState({
    children: [child],
    activeChildId: child.id,
    stickerDesigns: mergeStickerDesigns(source.stickerDesigns),
    appVersion: 2,
  });
}

function migrateChild(value: unknown): ChildProfile {
  const initial = createDefaultChild();
  if (!value || typeof value !== "object") return initial;
  const source = value as Record<string, unknown>;
  const totalHanamaru = Math.max(0, toNumber(source.totalHanamaru ?? source.totalStars, 0));
  const promises = migratePromises(source.promises) ?? initial.promises;

  return {
    id: typeof source.id === "string" && source.id ? source.id : initial.id,
    name: typeof source.name === "string" && source.name.trim() ? source.name.trim() : initial.name,
    promises,
    records: migrateRecords(source.records),
    treasures: migrateTreasures(source.treasures, totalHanamaru),
    stickers: migrateStickers(source.stickers),
    princessImages: isRecord(source.princessImages) ? source.princessImages as Record<number, string | undefined> : {},
    totalHanamaru,
    lastKnownLevel: toNumber(source.lastKnownLevel, getCurrentPrincessGrowth(totalHanamaru).level),
    createdAt: typeof source.createdAt === "string" ? source.createdAt : nowIso(),
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : nowIso(),
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

function migrateStickers(value: unknown): Sticker[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map(migrateSticker);
}

function migrateSticker(value: Record<string, unknown>): Sticker {
  const type = isStickerType(value.type) ? value.type : "hanamaru";
  const label = typeof value.label === "string" && value.label ? value.label : defaultStickerDesigns.find((item) => item.type === type)?.label ?? "シール";
  return {
    id: typeof value.id === "string" && value.id ? value.id : `sticker-${crypto.randomUUID()}`,
    date: typeof value.date === "string" && value.date ? value.date : nowIso().slice(0, 10),
    type,
    label,
    reason: typeof value.reason === "string" && value.reason ? value.reason : label,
    promiseId: typeof value.promiseId === "string" && value.promiseId ? value.promiseId : "legacy",
    promiseTitle: typeof value.promiseTitle === "string" && value.promiseTitle ? value.promiseTitle : "これまでのシール",
    createdAt: typeof value.createdAt === "string" && value.createdAt ? value.createdAt : nowIso(),
  };
}

function mergeStickerDesigns(value: unknown): StickerDesign[] {
  if (!Array.isArray(value)) return defaultStickerDesigns;
  return defaultStickerDesigns.map((design) => {
    const saved = value.find((item) => isRecord(item) && item.type === design.type);
    if (!isRecord(saved)) return design;
    return {
      ...design,
      imageDataUrl: typeof saved.imageDataUrl === "string" && saved.imageDataUrl ? saved.imageDataUrl : undefined,
    };
  });
}

function stripImageDataUrls(state: AppState): AppState {
  return {
    ...state,
    children: state.children.map((child) => ({
      ...child,
      princessImages: Object.fromEntries(
        Object.entries(child.princessImages).map(([level]) => [level, undefined]),
      ) as Record<number, string | undefined>,
    })),
    stickerDesigns: state.stickerDesigns.map((design) => ({
      ...design,
      imageDataUrl: undefined,
    })),
  };
}

function isStickerType(value: unknown): value is Sticker["type"] {
  return value === "hanamaru" || value === "rainbow" || value === "crown" || value === "diamond" || value === "ribbon";
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
