type CelebrationOverlayProps = {
  message: string;
  onClose: () => void;
};

export function CelebrationOverlay({ message, onClose }: CelebrationOverlayProps) {
  return (
    <div className="overlay confetti-overlay" role="dialog" aria-modal="true">
      <div className="overlay-card">
        <div className="big-sparkle">💮🎀✨</div>
        <h2>{message}</h2>
        <p>おしろが キラキラ！</p>
        <button className="primary-button" type="button" onClick={onClose}>にこにこ</button>
      </div>
    </div>
  );
}
