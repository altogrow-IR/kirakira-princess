import type { AppState, Sticker } from "../types";
import { formatDisplayDate, getRecentDates } from "../utils/date";

type StickerBookProps = {
  state: AppState;
};

export function StickerBook({ state }: StickerBookProps) {
  const recentDates = new Set(getRecentDates(7));
  const recentStickers = state.stickers.filter((sticker) => recentDates.has(sticker.date));

  return (
    <section className="screen-section sticker-book">
      <h2>がんばったきろく</h2>
      <p className="count-badge">シール {state.stickers.length}こ</p>
      {state.stickers.length === 0 ? (
        <div className="empty-card">きょうから シールを あつめよう！</div>
      ) : (
        <>
          <h3>さいきん7にち</h3>
          <div className="sticker-list">{recentStickers.map((sticker) => <StickerRow key={sticker.id} sticker={sticker} state={state} />)}</div>
          <h3>すべてのシール</h3>
          <div className="sticker-list">{state.stickers.map((sticker) => <StickerRow key={sticker.id} sticker={sticker} state={state} />)}</div>
        </>
      )}
    </section>
  );
}

function StickerRow({ sticker, state }: { sticker: Sticker; state: AppState }) {
  const design = state.stickerDesigns.find((item) => item.type === sticker.type);
  return (
    <article className="sticker-row">
      <div className="sticker-mark">
        {design?.imageDataUrl ? <img src={design.imageDataUrl} alt={design.label} /> : <span>{design?.emoji ?? "💮"}</span>}
      </div>
      <div>
        <p className="small-label">{formatDisplayDate(sticker.date)}</p>
        <h4>{design?.label ?? sticker.label}</h4>
        <p>{sticker.reason}</p>
      </div>
    </article>
  );
}
