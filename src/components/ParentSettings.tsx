import { useEffect, useState } from "react";
import type { AppState, PromiseItem } from "../types";
import { createInitialState } from "../storage";
import { addChild, deleteChild, getActiveChild, renameChild, updateActiveChild } from "../utils/children";
import { PrincessImageSettings } from "./PrincessImageSettings";
import { StickerImageSettings } from "./StickerImageSettings";

type ParentSettingsProps = {
  state: AppState;
  onStateChange: (state: AppState) => void;
  onMessage: (message: string) => void;
};

export function ParentSettings({ state, onStateChange, onMessage }: ParentSettingsProps) {
  const activeChild = getActiveChild(state);
  const [newTitle, setNewTitle] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [childName, setChildName] = useState(activeChild.name);

  useEffect(() => {
    setChildName(activeChild.name);
  }, [activeChild.id, activeChild.name]);

  function updatePromise(id: string, patch: Partial<PromiseItem>) {
    onStateChange(updateActiveChild(state, (child) => ({
      ...child,
      promises: child.promises.map((item) => item.id === id ? { ...item, ...patch } : item),
    })));
  }

  function addPromise() {
    const title = newTitle.trim();
    if (!title) {
      onMessage("おやくそく名を入力してください。");
      return;
    }
    onStateChange(updateActiveChild(state, (child) => ({
      ...child,
      promises: [
        ...child.promises,
        {
          id: `promise-${crypto.randomUUID()}`,
          title,
          hanamaru: 1,
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    })));
    setNewTitle("");
  }

  function deletePromise(id: string) {
    const target = activeChild.promises.find((item) => item.id === id);
    if (!target) return;
    if (!confirm("このおやくそくを削除しますか？")) return;
    const completedCount = activeChild.records.filter((record) => record.completedPromiseIds.includes(id)).length;
    onStateChange(updateActiveChild(state, (child) => ({
      ...child,
      promises: child.promises.filter((item) => item.id !== id),
      records: child.records.map((record) => {
        const completedPromiseIds = record.completedPromiseIds.filter((completedId) => completedId !== id);
        const earnedHanamaru = child.promises
          .filter((item) => item.id !== id && completedPromiseIds.includes(item.id))
          .reduce((sum, item) => sum + item.hanamaru, 0);
        return { ...record, completedPromiseIds, earnedHanamaru };
      }),
      stickers: child.stickers.filter((sticker) => sticker.promiseId !== id),
      totalHanamaru: Math.max(0, child.totalHanamaru - completedCount * target.hanamaru),
    })));
  }

  function saveChildName() {
    onStateChange(renameChild(state, activeChild.id, childName));
    onMessage("名前を保存しました。");
  }

  function addNewChild() {
    const name = newChildName.trim();
    if (!name) {
      onMessage("名前を入力してください。");
      return;
    }
    onStateChange(addChild(state, name));
    setNewChildName("");
    onMessage("子どもを追加しました。");
  }

  function removeActiveChild() {
    if (state.children.length <= 1) {
      onMessage("子どもが1人のときは削除できません。");
      return;
    }
    if (!confirm(`${activeChild.name}ちゃんのデータを削除しますか？`)) return;
    onStateChange(deleteChild(state, activeChild.id));
    onMessage("子どもを削除しました。");
  }

  function resetData() {
    if (!confirm("すべてのデータをリセットしますか？")) return;
    if (!confirm("画像やシールも初期にもどります。よろしいですか？")) return;
    onStateChange(createInitialState());
  }

  return (
    <section className="screen-section parent-settings">
      <h2>パパ・ママメニュー</h2>
      <p className="hint-text">いまの設定：{activeChild.name}ちゃん</p>

      <section className="settings-block">
        <h3>子ども設定</h3>
        <div className="form-row">
          <input value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="子どもの名前" />
          <button className="secondary-button" type="button" onClick={saveChildName}>保存</button>
        </div>
        <div className="form-row">
          <input value={newChildName} onChange={(event) => setNewChildName(event.target.value)} placeholder="追加する名前" />
          <button className="secondary-button" type="button" onClick={addNewChild}>追加</button>
        </div>
        <button className="danger-button wide" type="button" onClick={removeActiveChild} disabled={state.children.length <= 1}>
          この子どもを削除
        </button>
      </section>

      <section className="settings-block">
        <h3>おやくそく設定</h3>
        <div className="form-row">
          <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="新しいおやくそく" />
          <button className="secondary-button" type="button" onClick={addPromise}>追加</button>
        </div>
        <div className="settings-list">
          {activeChild.promises.map((item) => (
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

      <PrincessImageSettings
        child={activeChild}
        onChange={(princessImages) => onStateChange(updateActiveChild(state, (child) => ({ ...child, princessImages })))}
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
