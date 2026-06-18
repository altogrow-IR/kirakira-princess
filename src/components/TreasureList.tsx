import type { Treasure } from "../types";

type TreasureListProps = {
  treasures: Treasure[];
  totalHanamaru: number;
};

export function TreasureList({ treasures, totalHanamaru }: TreasureListProps) {
  return (
    <section className="screen-section">
      <h2>たからもの</h2>
      <div className="treasure-grid">
        {treasures.map((treasure) => {
          const rest = Math.max(0, treasure.requiredHanamaru - totalHanamaru);
          return (
            <article className={`treasure-card ${treasure.unlocked ? "is-open" : ""}`} key={treasure.id}>
              <div className="treasure-emoji">{treasure.emoji}</div>
              <h3>{treasure.name}</h3>
              <p>{treasure.unlocked ? "きらきら オープン！" : `あと${rest}こで ひらくよ`}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
