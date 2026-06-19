export type PromiseItem = {
  id: string;
  title: string;
  hanamaru: number;
  enabled: boolean;
  createdAt: string;
};

export type DailyRecord = {
  date: string;
  completedPromiseIds: string[];
  earnedHanamaru: number;
};

export type Treasure = {
  id: string;
  name: string;
  requiredHanamaru: number;
  unlocked: boolean;
  emoji: string;
};

export type PrincessGrowth = {
  level: number;
  title: string;
  emoji: string;
  requiredHanamaru: number;
  nextRequiredHanamaru?: number;
};

export type StickerType = "hanamaru" | "rainbow" | "crown" | "diamond" | "ribbon";

export type StickerDesign = {
  type: StickerType;
  emoji: string;
  label: string;
  imageDataUrl?: string;
};

export type Sticker = {
  id: string;
  date: string;
  type: StickerType;
  label: string;
  reason: string;
  promiseId: string;
  promiseTitle: string;
  createdAt: string;
};

export type ChildProfile = {
  id: string;
  name: string;
  promises: PromiseItem[];
  records: DailyRecord[];
  treasures: Treasure[];
  stickers: Sticker[];
  princessImages: Record<number, string | undefined>;
  totalHanamaru: number;
  lastKnownLevel: number;
  createdAt: string;
  updatedAt: string;
};

export type AppState = {
  children: ChildProfile[];
  activeChildId: string;
  stickerDesigns: StickerDesign[];
  appVersion: 2;
};

export type AppView = "today" | "princess" | "treasures" | "stickers" | "calendar" | "parents";
