import type { StickerDesign } from "../types";
import { fileToDataUrl, validateImageFile } from "../utils/image";

type StickerImageSettingsProps = {
  designs: StickerDesign[];
  onChange: (designs: StickerDesign[]) => void;
  onMessage: (message: string) => void;
};

export function StickerImageSettings({ designs, onChange, onMessage }: StickerImageSettingsProps) {
  async function handleFile(type: StickerDesign["type"], file: File | undefined) {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      onMessage(validation.message ?? "画像をえらびなおしてください。");
      return;
    }
    try {
      const imageDataUrl = await fileToDataUrl(file);
      onChange(designs.map((design) => design.type === type ? { ...design, imageDataUrl } : design));
      onMessage("シール画像をかえました。");
    } catch {
      onMessage("画像を読みこめませんでした。");
    }
  }

  function removeImage(type: StickerDesign["type"]) {
    if (!confirm("このシール画像を 初期にもどしますか？")) return;
    onChange(designs.map((design) => design.type === type ? { ...design, imageDataUrl: undefined } : design));
  }

  return (
    <section className="settings-block">
      <h3>シール画像設定</h3>
      <p className="hint-text">シール画像は子ども全員で共通です。あとから変えると、前のシールにも反映されます。</p>
      <div className="settings-list">
        {designs.map((design) => (
          <article className="image-setting-row" key={design.type}>
            <div className="settings-preview">
              {design.imageDataUrl ? <img src={design.imageDataUrl} alt={design.label} /> : <span>{design.emoji}</span>}
            </div>
            <div className="settings-content">
              <h4>{design.label}</h4>
              <input
                aria-label={`${design.label}の画像`}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void handleFile(design.type, event.currentTarget.files?.[0])}
              />
              <button className="danger-button" type="button" onClick={() => removeImage(design.type)}>
                初期にもどす
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
