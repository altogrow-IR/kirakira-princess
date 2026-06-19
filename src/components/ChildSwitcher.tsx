import { useState } from "react";
import type { AppState } from "../types";
import { addChild } from "../utils/children";

type ChildSwitcherProps = {
  state: AppState;
  onStateChange: (state: AppState) => void;
  onSwitch: (childId: string) => void;
  onMessage: (message: string) => void;
};

export function ChildSwitcher({ state, onStateChange, onSwitch, onMessage }: ChildSwitcherProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const nextName = name.trim();
    if (!nextName) {
      onMessage("名前を入力してください。");
      return;
    }
    onStateChange(addChild(state, nextName));
    setName("");
    setIsAdding(false);
    onMessage("子どもを追加しました。");
  }

  return (
    <section className="child-switcher" aria-label="子ども切り替え">
      <div className="child-tabs">
        {state.children.map((child) => (
          <button
            key={child.id}
            className={child.id === state.activeChildId ? "child-tab active" : "child-tab"}
            type="button"
            onClick={() => onSwitch(child.id)}
          >
            <span>{child.id === state.activeChildId ? "👑" : "♡"}</span>
            {child.name}
          </button>
        ))}
        <button className="child-tab add-child-tab" type="button" onClick={() => setIsAdding((value) => !value)}>
          ＋
        </button>
      </div>
      {isAdding && (
        <div className="child-add-row">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="子どもの名前" />
          <button className="secondary-button" type="button" onClick={submit}>追加</button>
        </div>
      )}
    </section>
  );
}
