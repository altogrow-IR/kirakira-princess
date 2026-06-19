import type { PromiseItem, StickerDesign, StickerType } from "../types";

type StickerPickerModalProps = {
  isOpen: boolean;
  promise: PromiseItem | null;
  stickerDesigns: StickerDesign[];
  onSelect: (type: StickerType) => void;
  onCancel: () => void;
};

export function StickerPickerModal({ isOpen, promise, stickerDesigns, onSelect, onCancel }: StickerPickerModalProps) {
  if (!isOpen || !promise) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="sticker-picker-title">
      <section className="overlay-card sticker-picker-card">
        <p className="big-sparkle">💮</p>
        <h2 id="sticker-picker-title">どのシールを はる？</h2>
        <p className="sticker-picker-promise">{promise.title}</p>
        <div className="sticker-picker-grid">
          {stickerDesigns.map((design) => (
            <button className="sticker-choice" key={design.type} type="button" onClick={() => onSelect(design.type)}>
              <span className="sticker-choice-mark">
                {design.imageDataUrl ? <img src={design.imageDataUrl} alt={design.label} /> : <span>{design.emoji}</span>}
              </span>
              <span>{design.label}</span>
            </button>
          ))}
        </div>
        <button className="secondary-button wide" type="button" onClick={onCancel}>あとでえらぶ</button>
      </section>
    </div>
  );
}
