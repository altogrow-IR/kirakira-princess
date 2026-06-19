import { useEffect, useMemo, useState } from "react";
import type { AppState, AppView, DailyRecord, PromiseItem, StickerType } from "./types";
import { loadState, normalizeState, saveState } from "./storage";
import { getTodayKey, formatDisplayDate } from "./utils/date";
import { getCurrentPrincessGrowth } from "./utils/princessGrowth";
import { getActiveChild, switchActiveChild, updateActiveChild } from "./utils/children";
import { createStickerForPromise, getStickerForPromise, removeStickerForPromise, upsertStickerForPromise } from "./utils/stickers";
import { hydrateImages, syncImages } from "./utils/imageStorage";
import { PromiseCard } from "./components/PromiseCard";
import { PrincessPanel } from "./components/PrincessPanel";
import { TreasureList } from "./components/TreasureList";
import { StickerBook } from "./components/StickerBook";
import { CalendarView } from "./components/CalendarView";
import { ParentSettings } from "./components/ParentSettings";
import { PrincessUpOverlay } from "./components/PrincessUpOverlay";
import { CelebrationOverlay } from "./components/CelebrationOverlay";
import { ChildSwitcher } from "./components/ChildSwitcher";
import { StickerPickerModal } from "./components/StickerPickerModal";

const praiseMessages = [
  "すごい！",
  "できたね！",
  "きらきらだね！",
  "とってもすてき！",
  "かわいいプリンセス！",
  "はなまるをゲット！",
  "パパもママも うれしい！",
];

const stickerPraiseMessages = [
  "シールを はったよ！",
  "かわいいシールだね！",
  "はなまる すごいね！",
  "きょうも きらきら！",
];

const tabs: { id: AppView; label: string; icon: string }[] = [
  { id: "today", label: "きょう", icon: "💮" },
  { id: "princess", label: "プリンセス", icon: "👑" },
  { id: "treasures", label: "たからもの", icon: "🎀" },
  { id: "stickers", label: "シール", icon: "📖" },
  { id: "parents", label: "パパ・ママ", icon: "⚙️" },
];

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<AppView>("today");
  const [toast, setToast] = useState("");
  const [princessUpTitle, setPrincessUpTitle] = useState("");
  const [celebration, setCelebration] = useState("");
  const [stickerPromise, setStickerPromise] = useState<PromiseItem | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const today = getTodayKey();
  const activeChild = getActiveChild(state);

  const enabledPromises = useMemo(() => activeChild.promises.filter((item) => item.enabled), [activeChild.promises]);
  const todayRecord = activeChild.records.find((record) => record.date === today) ?? createEmptyRecord(today);
  const completedCount = enabledPromises.filter((item) => todayRecord.completedPromiseIds.includes(item.id)).length;
  const achievementRate = enabledPromises.length > 0 ? Math.round((completedCount / enabledPromises.length) * 100) : 0;
  const remainingCount = Math.max(0, enabledPromises.length - completedCount);

  useEffect(() => {
    let cancelled = false;

    async function hydrateStoredImages() {
      const stateWithImages = await hydrateImages(state);
      if (cancelled) return;
      setState(normalizeState(stateWithImages));
      setImagesReady(true);
    }

    void hydrateStoredImages();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveState(state);
    if (imagesReady || hasImageDataUrls(state)) {
      void syncImages(state);
    }
  }, [imagesReady, state]);

  function updateState(nextState: AppState) {
    setState(normalizeState(nextState));
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function togglePromise(id: string) {
    const promise = activeChild.promises.find((item) => item.id === id);
    if (!promise || !promise.enabled) return;

    const beforeLevel = getCurrentPrincessGrowth(activeChild.totalHanamaru).level;
    const record = activeChild.records.find((item) => item.date === today) ?? createEmptyRecord(today);
    const isCompleted = record.completedPromiseIds.includes(id);
    const completedPromiseIds = isCompleted
      ? record.completedPromiseIds.filter((completedId) => completedId !== id)
      : [...record.completedPromiseIds, id];
    const earnedHanamaru = activeChild.promises
      .filter((item) => completedPromiseIds.includes(item.id))
      .reduce((sum, item) => sum + item.hanamaru, 0);
    const totalHanamaru = Math.max(0, activeChild.totalHanamaru + (isCompleted ? -promise.hanamaru : promise.hanamaru));
    const nextRecord: DailyRecord = { ...record, completedPromiseIds, earnedHanamaru };
    const nextGrowth = getCurrentPrincessGrowth(totalHanamaru);

    const nextState = updateActiveChild(state, (child) => ({
      ...child,
      records: upsertRecord(child.records, nextRecord),
      stickers: isCompleted ? removeStickerForPromise(child.stickers, today, promise.id) : child.stickers,
      totalHanamaru,
      lastKnownLevel: nextGrowth.level > child.lastKnownLevel ? nextGrowth.level : child.lastKnownLevel,
    }));

    updateState(nextState);

    if (!isCompleted) {
      setStickerPromise(promise);
      showToast(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
    }
    if (!isCompleted && completedPromiseIds.length === enabledPromises.length && enabledPromises.length > 0) {
      setCelebration("ぜんぶできたね！");
    }
    if (nextGrowth.level > beforeLevel && nextGrowth.level > activeChild.lastKnownLevel) {
      setPrincessUpTitle(nextGrowth.title);
    }
  }

  function openStickerPicker(promise: PromiseItem) {
    setStickerPromise(promise);
  }

  function selectSticker(type: StickerType) {
    if (!stickerPromise) return;
    const design = state.stickerDesigns.find((item) => item.type === type);
    if (!design) return;
    const sticker = createStickerForPromise(today, stickerPromise, type, design);
    updateState(updateActiveChild(state, (child) => ({
      ...child,
      stickers: upsertStickerForPromise(child.stickers, sticker),
    })));
    setStickerPromise(null);
    showToast(stickerPraiseMessages[Math.floor(Math.random() * stickerPraiseMessages.length)]);
  }

  function renderScreen() {
    if (view === "princess") {
      return (
        <section className="screen-section">
          <h2>プリンセス</h2>
          <PrincessPanel child={activeChild} variant="large" />
        </section>
      );
    }
    if (view === "treasures") return <TreasureList treasures={activeChild.treasures} totalHanamaru={activeChild.totalHanamaru} />;
    if (view === "stickers") return <StickerBook child={activeChild} stickerDesigns={state.stickerDesigns} />;
    if (view === "calendar") return <CalendarView child={activeChild} stickerDesigns={state.stickerDesigns} onOpenStickers={() => setView("stickers")} />;
    if (view === "parents") return <ParentSettings state={state} onStateChange={updateState} onMessage={showToast} />;

    return (
      <section className="today-screen">
        <header className="app-header">
          <p className="small-label">{formatDisplayDate(today)}</p>
          <h1>きらきらプリンセス</h1>
          <p>{activeChild.name}ちゃん、きょうも にこにこでいこう</p>
        </header>
        <PrincessPanel child={activeChild} />
        <section className="score-strip">
          <div><span>きょう</span><strong>{todayRecord.earnedHanamaru}こ</strong></div>
          <div><span>あつめた</span><strong>{activeChild.totalHanamaru}こ</strong></div>
          <div><span>あと</span><strong>{remainingCount}こ</strong></div>
        </section>
        <section className="screen-section">
          <div className="section-heading">
            <h2>きょうのできた</h2>
            <span>{achievementRate}%</span>
          </div>
          <div className="promise-list">
            {enabledPromises.map((item) => (
              <PromiseCard
                key={item.id}
                item={item}
                completed={todayRecord.completedPromiseIds.includes(item.id)}
                sticker={getStickerForPromise(activeChild.stickers, today, item.id)}
                stickerDesigns={state.stickerDesigns}
                onToggle={togglePromise}
                onOpenSticker={openStickerPicker}
              />
            ))}
          </div>
          {enabledPromises.length === 0 && <div className="empty-card">パパ・ママメニューで おやくそくを ふやせます。</div>}
          <button className="secondary-button wide" type="button" onClick={() => setView("calendar")}>カレンダーをみる</button>
        </section>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <ChildSwitcher
        state={state}
        onStateChange={updateState}
        onSwitch={(childId) => updateState(switchActiveChild(state, childId))}
        onMessage={showToast}
      />
      <main>{renderScreen()}</main>
      <nav className="tab-nav" aria-label="画面切り替え">
        {tabs.map((tab) => (
          <button key={tab.id} className={view === tab.id ? "active" : ""} type="button" onClick={() => setView(tab.id)}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      <StickerPickerModal
        isOpen={Boolean(stickerPromise)}
        promise={stickerPromise}
        stickerDesigns={state.stickerDesigns}
        onSelect={selectSticker}
        onCancel={() => setStickerPromise(null)}
      />
      {toast && <div className="toast">{toast}</div>}
      {princessUpTitle && <PrincessUpOverlay title={princessUpTitle} onClose={() => setPrincessUpTitle("")} />}
      {celebration && <CelebrationOverlay message={celebration} onClose={() => setCelebration("")} />}
    </div>
  );
}

function createEmptyRecord(date: string): DailyRecord {
  return { date, completedPromiseIds: [], earnedHanamaru: 0 };
}

function upsertRecord(records: DailyRecord[], nextRecord: DailyRecord): DailyRecord[] {
  const exists = records.some((record) => record.date === nextRecord.date);
  return exists
    ? records.map((record) => record.date === nextRecord.date ? nextRecord : record)
    : [...records, nextRecord];
}

function hasImageDataUrls(state: AppState): boolean {
  return state.stickerDesigns.some((design) => Boolean(design.imageDataUrl))
    || state.children.some((child) => Object.values(child.princessImages).some(Boolean));
}
