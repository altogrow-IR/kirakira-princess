import type { ChildProfile } from "../types";
import {
  getCurrentPrincessGrowth,
  getHanamaruToNextPrincessLevel,
  getPrincessLevelProgress,
} from "../utils/princessGrowth";
import { ProgressBar } from "./ProgressBar";

type PrincessPanelProps = {
  child: ChildProfile;
  variant?: "compact" | "large";
};

export function PrincessPanel({ child, variant = "compact" }: PrincessPanelProps) {
  const growth = getCurrentPrincessGrowth(child.totalHanamaru);
  const image = child.princessImages[growth.level];
  const toNext = getHanamaruToNextPrincessLevel(child.totalHanamaru);
  const progress = getPrincessLevelProgress(child.totalHanamaru);

  return (
    <section className={`princess-panel princess-panel-${variant}`}>
      <div className="princess-avatar" aria-label={`${growth.title}のすがた`}>
        {image ? <img src={image} alt={`${growth.title}の画像`} /> : <span>{growth.emoji}</span>}
      </div>
      <div className="princess-info">
        <p className="small-label">プリンセス Lv.{growth.level}</p>
        <h2>{growth.title}</h2>
        <p>あつめたはなまる：{child.totalHanamaru}こ</p>
        <p>{toNext > 0 ? `つぎのプリンセスアップまで あと${toNext}こ！` : "いちばん きらきら！"}</p>
        <ProgressBar value={progress} label="プリンセスアップ" />
      </div>
    </section>
  );
}
