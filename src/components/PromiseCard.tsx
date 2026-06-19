import type { PromiseItem, Sticker, StickerDesign } from "../types";

type PromiseCardProps = {
  item: PromiseItem;
  completed: boolean;
  sticker?: Sticker;
  stickerDesigns: StickerDesign[];
  onToggle: (id: string) => void;
  onOpenSticker: (item: PromiseItem) => void;
};

export function PromiseCard({ item, completed, sticker, stickerDesigns, onToggle, onOpenSticker }: PromiseCardProps) {
  const design = sticker ? stickerDesigns.find((designItem) => designItem.type === sticker.type) : undefined;

  return (
    <article className={`promise-card ${completed ? "is-done" : ""}`}>
      <div className="promise-main">
        <p className="promise-title">{item.title}</p>
        <p className="promise-point">はなまる {item.hanamaru}こ</p>
        {completed && (
          <div className="promise-sticker-status">
            {sticker ? (
              <>
                <span className="mini-sticker">
                  {design?.imageDataUrl ? <img src={design.imageDataUrl} alt={design.label} /> : <span>{design?.emoji ?? "💮"}</span>}
                </span>
                <span>{design?.label ?? sticker.label}</span>
              </>
            ) : (
              <span>シールを えらべます</span>
            )}
          </div>
        )}
      </div>
      <div className="promise-actions">
        <button className="primary-button" type="button" onClick={() => onToggle(item.id)}>
          {completed ? "できたね" : "できた！"}
        </button>
        {completed && (
          <button className="secondary-button" type="button" onClick={() => onOpenSticker(item)}>
            {sticker ? "シールを かえる" : "シールを はる"}
          </button>
        )}
      </div>
    </article>
  );
}
