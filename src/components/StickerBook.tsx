import type { ChildProfile, Sticker, StickerDesign } from "../types";
import { formatDisplayDate, getRecentDates } from "../utils/date";

type StickerBookProps = {
  child: ChildProfile;
  stickerDesigns: StickerDesign[];
};

export function StickerBook({ child, stickerDesigns }: StickerBookProps) {
  const stickers = [...child.stickers].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const recentDates = new Set(getRecentDates(7));
  const recentStickers = stickers.filter((sticker) => recentDates.has(sticker.date));

  return (
    <section className="screen-section sticker-book">
      <h2>{child.name}ちゃんのシール帳</h2>
      <p className="count-badge">シール {stickers.length}こ</p>
      {stickers.length === 0 ? (
        <div className="empty-card">きょうから シールを あつめよう！</div>
      ) : (
        <>
          <h3>さいきん7にち</h3>
          <div className="sticker-list">
            {recentStickers.map((sticker) => <StickerRow key={sticker.id} sticker={sticker} designs={stickerDesigns} />)}
          </div>
          <h3>すべてのシール</h3>
          <div className="sticker-list">
            {stickers.map((sticker) => <StickerRow key={sticker.id} sticker={sticker} designs={stickerDesigns} />)}
          </div>
        </>
      )}
    </section>
  );
}

function StickerRow({ sticker, designs }: { sticker: Sticker; designs: StickerDesign[] }) {
  const design = designs.find((item) => item.type === sticker.type);
  return (
    <article className="sticker-row">
      <div className="sticker-mark">
        {design?.imageDataUrl ? <img src={design.imageDataUrl} alt={design.label} /> : <span>{design?.emoji ?? "💮"}</span>}
      </div>
      <div>
        <p className="small-label">{formatDisplayDate(sticker.date)}</p>
        <h4>{sticker.promiseTitle}</h4>
        <p>{design?.label ?? sticker.label}</p>
        <p className="hint-text">{sticker.reason}</p>
      </div>
    </article>
  );
}
