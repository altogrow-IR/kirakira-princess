import type { ChildProfile, StickerDesign } from "../types";
import { formatDisplayDate, getRecentDates } from "../utils/date";

type CalendarViewProps = {
  child: ChildProfile;
  stickerDesigns: StickerDesign[];
  onOpenStickers: () => void;
};

export function CalendarView({ child, stickerDesigns, onOpenStickers }: CalendarViewProps) {
  return (
    <section className="screen-section">
      <h2>きらきらカレンダー</h2>
      <div className="calendar-list">
        {getRecentDates(7).map((date) => {
          const record = child.records.find((item) => item.date === date);
          const stickers = child.stickers.filter((item) => item.date === date);
          return (
            <article className={`calendar-day ${stickers.length > 0 ? "has-sticker" : ""}`} key={date}>
              <div>
                <h3>{formatDisplayDate(date)}</h3>
                <p>はなまる {record?.earnedHanamaru ?? 0}こ</p>
              </div>
              <div className="calendar-stickers">
                {stickers.length > 0 ? stickers.map((sticker) => {
                  const design = stickerDesigns.find((item) => item.type === sticker.type);
                  return <span key={sticker.id}>{design?.emoji ?? "💮"}</span>;
                }) : <span>♡</span>}
              </div>
            </article>
          );
        })}
      </div>
      <button className="secondary-button wide" type="button" onClick={onOpenStickers}>
        シールちょうをみる
      </button>
    </section>
  );
}
