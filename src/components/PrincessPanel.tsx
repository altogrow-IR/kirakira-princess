import type { AppState } from "../types";
import {
  getCurrentPrincessGrowth,
  getHanamaruToNextPrincessLevel,
  getPrincessLevelProgress,
} from "../utils/princessGrowth";
import { ProgressBar } from "./ProgressBar";

type PrincessPanelProps = {
  state: AppState;
  variant?: "compact" | "large";
};

export function PrincessPanel({ state, variant = "compact" }: PrincessPanelProps) {
  const growth = getCurrentPrincessGrowth(state.totalHanamaru);
  const image = state.princessImages[growth.level];
  const toNext = getHanamaruToNextPrincessLevel(state.totalHanamaru);
  const progress = getPrincessLevelProgress(state.totalHanamaru);

  return (
    <section className={`princess-panel princess-panel-${variant}`}>
      <div className="princess-avatar" aria-label={`${growth.title}のすがた`}>
        {image ? <img src={image} alt={`${growth.title}の画像`} /> : <span>{growth.emoji}</span>}
      </div>
      <div className="princess-info">
        <p className="small-label">プリンセス Lv.{growth.level}</p>
        <h2>{growth.title}</h2>
        <p>あつめたはなまる：{state.totalHanamaru}こ</p>
        <p>{toNext > 0 ? `つぎのプリンセスアップまで あと${toNext}こ！` : "いちばん きらきら！"}</p>
        <ProgressBar value={progress} label="プリンセスアップ" />
      </div>
    </section>
  );
}
