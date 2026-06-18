type PrincessUpOverlayProps = {
  title: string;
  onClose: () => void;
};

export function PrincessUpOverlay({ title, onClose }: PrincessUpOverlayProps) {
  return (
    <div className="overlay sparkle-overlay" role="dialog" aria-modal="true">
      <div className="overlay-card">
        <div className="big-sparkle">👑✨</div>
        <h2>プリンセスアップ！</h2>
        <p>{title}に なったよ！</p>
        <button className="primary-button" type="button" onClick={onClose}>やったね</button>
      </div>
    </div>
  );
}
