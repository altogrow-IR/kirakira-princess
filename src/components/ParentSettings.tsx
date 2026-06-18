import { useState } from "react";
import type { AppState, PromiseItem } from "../types";
import { createInitialState } from "../storage";
import { PrincessImageSettings } from "./PrincessImageSettings";
import { StickerImageSettings } from "./StickerImageSettings";

type ParentSettingsProps = {
  state: AppState;
  onStateChange: (state: AppState) => void;
  onMessage: (message: string) => void;
};

export function ParentSettings({ state, onStateChange, onMessage }: ParentSettingsProps) {
  const [newTitle, setNewTitle] = useState("");
  const [childName, setChildName] = useState(state.childName);

  function updatePromise(id: string, patch: Partial<PromiseItem>) {
    onStateChange({
      ...state,
      promises: state.promises.map((item) => item.id === id ? { ...item, ...patch } : item),
    });
  }

  function addPromise() {
    const title = newTitle.trim();
    if (!title) {
      onMessage("おやくそく名を入力してください。");
      return;
    }
    onStateChange({
      ...state,
      promises: [
        ...state.promises,
        {
          id: `promise-${crypto.randomUUID()}`,
          title,
          hanamaru: 1,
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setNewTitle("");
  }

  function deletePromise(id: string) {
    if (!confirm("このおやくそくを削除しますか？")) return;
    onStateChange({
      ...state,
      promises: state.promises.filter((item) => item.id !== id),
      records: state.records.map((record) => ({
        ...record,
        completedPromiseIds: record.completedPromiseIds.filter((completedId) => completedId !== id),
      })),
    });
  }

  function saveChildName() {
    const nextName = childName.trim() || "プリンセス";
    onStateChange({ ...state, childName: nextName });
    onMessage("名前を保存しました。");
  }

  function resetData() {
    if (!confirm("すべてのデータをリセットしますか？")) return;
    if (!confirm("画像やシールも初期にもどります。よろしいですか？")) return;
    onStateChange(createInitialState());
  }

  return (
    <section className="screen-section parent-settings">
      <h2>パパ・ママメニュー</h2>
      <p className="hint-text">変更やリセットには確認が出ます。</p>

      <section className="settings-block">
        <h3>おやくそく設定</h3>
        <div className="form-row">
          <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="新しいおやくそく" />
          <button className="secondary-button" type="button" onClick={addPromise}>追加</button>
        </div>
        <div className="settings-list">
          {state.promises.map((item) => (
            <article className="promise-setting-row" key={item.id}>
              <input value={item.title} onChange={(event) => updatePromise(item.id, { title: event.target.value })} />
              <label className="toggle-row">
                <input type="checkbox" checked={item.enabled} onChange={(event) => updatePromise(item.id, { enabled: event.target.checked })} />
                ON
              </label>
              <button className="danger-button" type="button" onClick={() => deletePromise(item.id)}>削除</button>
            </article>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <h3>名前設定</h3>
        <div className="form-row">
          <input value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="子どもの名前" />
          <button className="secondary-button" type="button" onClick={saveChildName}>保存</button>
        </div>
      </section>

      <PrincessImageSettings
        state={state}
        onChange={(princessImages) => onStateChange({ ...state, princessImages })}
        onMessage={onMessage}
      />

      <StickerImageSettings
        designs={state.stickerDesigns}
        onChange={(stickerDesigns) => onStateChange({ ...state, stickerDesigns })}
        onMessage={onMessage}
      />

      <section className="settings-block danger-zone">
        <h3>データリセット</h3>
        <button className="danger-button wide" type="button" onClick={resetData}>リセットする</button>
      </section>
    </section>
  );
}
