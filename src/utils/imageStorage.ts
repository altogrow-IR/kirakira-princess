import type { AppState } from "../types";

const DB_NAME = "kirakira-princess-images";
const STORE_NAME = "images";
const DB_VERSION = 1;

type ImageRecord = {
  key: string;
  dataUrl: string;
};

const princessKey = (childId: string, level: string | number): string => `princess:${childId}:${level}`;
const stickerKey = (type: string): string => `sticker:${type}`;

export async function hydrateImages(state: AppState): Promise<AppState> {
  try {
    const records = await getAllImageRecords();
    if (records.length === 0) return state;
    const imageMap = new Map(records.map((record) => [record.key, record.dataUrl]));

    return {
      ...state,
      children: state.children.map((child) => {
        const princessImages = { ...child.princessImages };
        for (const [key, dataUrl] of imageMap) {
          const prefix = `princess:${child.id}:`;
          if (!key.startsWith(prefix)) continue;
          const level = key.slice(prefix.length);
          princessImages[Number(level)] = dataUrl;
        }
        return { ...child, princessImages };
      }),
      stickerDesigns: state.stickerDesigns.map((design) => ({
        ...design,
        imageDataUrl: imageMap.get(stickerKey(design.type)) ?? design.imageDataUrl,
      })),
    };
  } catch (error) {
    console.warn("画像データを読みこめませんでした。", error);
    return state;
  }
}

export async function syncImages(state: AppState): Promise<void> {
  try {
    const nextRecords = collectImageRecords(state);
    const nextKeys = new Set(nextRecords.map((record) => record.key));
    const currentKeys = await getAllImageKeys();
    const keysToDelete = currentKeys.filter(isAppImageKey).filter((key) => !nextKeys.has(key));
    await Promise.all([
      ...nextRecords.map((record) => putImageRecord(record)),
      ...keysToDelete.map((key) => deleteImageRecord(key)),
    ]);
  } catch (error) {
    console.warn("画像データを保存できませんでした。", error);
  }
}

function collectImageRecords(state: AppState): ImageRecord[] {
  const records: ImageRecord[] = [];

  for (const child of state.children) {
    for (const [level, dataUrl] of Object.entries(child.princessImages)) {
      if (typeof dataUrl === "string" && dataUrl) {
        records.push({ key: princessKey(child.id, level), dataUrl });
      }
    }
  }

  for (const design of state.stickerDesigns) {
    if (design.imageDataUrl) {
      records.push({ key: stickerKey(design.type), dataUrl: design.imageDataUrl });
    }
  }

  return records;
}

function isAppImageKey(key: IDBValidKey): key is string {
  return typeof key === "string" && (key.startsWith("princess:") || key.startsWith("sticker:"));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function getAllImageRecords(): Promise<ImageRecord[]> {
  return withStore<ImageRecord[]>("readonly", (store) => store.getAll());
}

function getAllImageKeys(): Promise<IDBValidKey[]> {
  return withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
}

function putImageRecord(record: ImageRecord): Promise<IDBValidKey> {
  return withStore<IDBValidKey>("readwrite", (store) => store.put(record));
}

function deleteImageRecord(key: string): Promise<undefined> {
  return withStore<undefined>("readwrite", (store) => store.delete(key));
}
