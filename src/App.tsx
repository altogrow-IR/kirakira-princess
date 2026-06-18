import { useEffect, useMemo, useState } from "react";
import type { AppState, AppView, DailyRecord } from "./types";
import { loadState, refreshTreasures, saveState } from "./storage";
import { getTodayKey, formatDisplayDate } from "./utils/date";
import { getCurrentPrincessGrowth } from "./utils/princessGrowth";
import { recalculateStickers } from "./utils/stickers";
import { PromiseCard } from "./components/PromiseCard";
import { PrincessPanel } from "./components/PrincessPanel";
import { TreasureList } from "./components/TreasureList";
import { StickerBook } from "./components/StickerBook";
import { CalendarView } from "./components/CalendarView";
import { ParentSettings } from "./components/ParentSettings";
import { PrincessUpOverlay } from "./components/PrincessUpOverlay";
import { CelebrationOverlay } from "./components/CelebrationOverlay";

const praiseMessages = [
  "すごい！",
  "できたね！",
  "きらきらだね！",
  "とってもすてき！",
  "かわいいプリンセス！",
  "はなまるをゲット！",
  "シールをゲット！",
  "パパもママも うれしい！",
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
  const today = getTodayKey();

  const enabledPromises = useMemo(() => state.promises.filter((item) => item.enabled), [state.promises]);
  const todayRecord = state.records.find((record) => record.date === today) ?? createEmptyRecord(today);
  const completedCount = enabledPromises.filter((item) => todayRecord.completedPromiseIds.includes(item.id)).length;
  const achievementRate = enabledPromises.length > 0 ? Math.round((completedCount / enabledPromises.length) * 100) : 0;
  const remainingCount = Math.max(0, enabledPromises.length - completedCount);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function updateState(nextState: AppState) {
    const totalSafeState = {
      ...nextState,
      totalHanamaru: Math.max(0, nextState.totalHanamaru),
      treasures: refreshTreasures(nextState.treasures, Math.max(0, nextState.totalHanamaru)),
    };
    setState(totalSafeState);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function togglePromise(id: string) {
    const promise = state.promises.find((item) => item.id === id);
    if (!promise || !promise.enabled) return;

    const beforeLevel = getCurrentPrincessGrowth(state.totalHanamaru).level;
    const record = state.records.find((item) => item.date === today) ?? createEmptyRecord(today);
    const isCompleted = record.completedPromiseIds.includes(id);
    const completedPromiseIds = isCompleted
      ? record.completedPromiseIds.filter((completedId) => completedId !== id)
      : [...record.completedPromiseIds, id];
    const earnedHanamaru = enabledPromises
      .filter((item) => completedPromiseIds.includes(item.id))
      .reduce((sum, item) => sum + item.hanamaru, 0);
    const totalHanamaru = Math.max(0, state.totalHanamaru + (isCompleted ? -promise.hanamaru : promise.hanamaru));
    const nextRecord: DailyRecord = { ...record, completedPromiseIds, earnedHanamaru };
    const records = upsertRecord(state.records, nextRecord);
    const withRecord: AppState = { ...state, records, totalHanamaru };
    const stickers = recalculateStickers(withRecord, today);
    const nextGrowth = getCurrentPrincessGrowth(totalHanamaru);
    const nextState = {
      ...withRecord,
      stickers,
      treasures: refreshTreasures(state.treasures, totalHanamaru),
      lastKnownLevel: nextGrowth.level > state.lastKnownLevel ? nextGrowth.level : state.lastKnownLevel,
    };

    updateState(nextState);

    if (!isCompleted) {
      showToast(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
    }
    if (!isCompleted && completedPromiseIds.length === enabledPromises.length && enabledPromises.length > 0) {
      setCelebration("ぜんぶできたね！");
    }
    if (nextGrowth.level > beforeLevel && nextGrowth.level > state.lastKnownLevel) {
      setPrincessUpTitle(nextGrowth.title);
    }
  }

  function renderScreen() {
    if (view === "princess") {
      return (
        <section className="screen-section">
          <h2>プリンセス</h2>
          <PrincessPanel state={state} variant="large" />
        </section>
      );
    }
    if (view === "treasures") return <TreasureList treasures={state.treasures} totalHanamaru={state.totalHanamaru} />;
    if (view === "stickers") return <StickerBook state={state} />;
    if (view === "calendar") return <CalendarView state={state} onOpenStickers={() => setView("stickers")} />;
    if (view === "parents") return <ParentSettings state={state} onStateChange={updateState} onMessage={showToast} />;

    return (
      <section className="today-screen">
        <header className="app-header">
          <p className="small-label">{formatDisplayDate(today)}</p>
          <h1>きらきらプリンセス</h1>
          <p>{state.childName}、きょうも にこにこでいこう</p>
        </header>
        <PrincessPanel state={state} />
        <section className="score-strip">
          <div><span>きょう</span><strong>{todayRecord.earnedHanamaru}こ</strong></div>
          <div><span>あつめた</span><strong>{state.totalHanamaru}こ</strong></div>
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
                onToggle={togglePromise}
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
      <main>{renderScreen()}</main>
      <nav className="tab-nav" aria-label="画面切り替え">
        {tabs.map((tab) => (
          <button key={tab.id} className={view === tab.id ? "active" : ""} type="button" onClick={() => setView(tab.id)}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
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
