import type { PromiseItem } from "../types";

type PromiseCardProps = {
  item: PromiseItem;
  completed: boolean;
  onToggle: (id: string) => void;
};

export function PromiseCard({ item, completed, onToggle }: PromiseCardProps) {
  return (
    <article className={`promise-card ${completed ? "is-done" : ""}`}>
      <div>
        <p className="promise-title">{item.title}</p>
        <p className="promise-point">はなまる {item.hanamaru}こ</p>
      </div>
      <button className="primary-button" type="button" onClick={() => onToggle(item.id)}>
        {completed ? "💮 できたね" : "できた！"}
      </button>
    </article>
  );
}
