import type { ChildProfile } from "../types";
import { princessGrowths } from "../utils/princessGrowth";
import { fileToDataUrl, validateImageFile } from "../utils/image";

type PrincessImageSettingsProps = {
  child: ChildProfile;
  onChange: (images: ChildProfile["princessImages"]) => void;
  onMessage: (message: string) => void;
};

export function PrincessImageSettings({ child, onChange, onMessage }: PrincessImageSettingsProps) {
  async function handleFile(level: number, file: File | undefined) {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      onMessage(validation.message ?? "画像をえらびなおしてください。");
      return;
    }
    try {
      const imageDataUrl = await fileToDataUrl(file);
      onChange({ ...child.princessImages, [level]: imageDataUrl });
      onMessage("プリンセス画像をかえました。");
    } catch {
      onMessage("画像を読みこめませんでした。");
    }
  }

  function removeImage(level: number) {
    if (!confirm("このプリンセス画像を 初期にもどしますか？")) return;
    const next = { ...child.princessImages };
    delete next[level];
    onChange(next);
  }

  return (
    <section className="settings-block">
      <h3>プリンセス画像設定</h3>
      <p className="hint-text">PNG / JPG / WebP の画像を登録できます。</p>
      <div className="settings-list">
        {princessGrowths.map((growth) => {
          const image = child.princessImages[growth.level];
          return (
            <article className="image-setting-row" key={growth.level}>
              <div className="settings-preview">
                {image ? <img src={image} alt={`${growth.title}の画像`} /> : <span>{growth.emoji}</span>}
              </div>
              <div className="settings-content">
                <h4>Lv.{growth.level} {growth.title}</h4>
                <input
                  aria-label={`${growth.title}の画像`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => void handleFile(growth.level, event.currentTarget.files?.[0])}
                />
                <button className="danger-button" type="button" onClick={() => removeImage(growth.level)}>
                  初期にもどす
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
