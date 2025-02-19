import styles from './SplashScreenButton.module.css';

type AnimatedButtonProps = {
  buttonText: string;
  onClick: () => void;
};

export default function SplashScreenButton({ buttonText, onClick }: AnimatedButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={styles.button}
    >
      <div className={styles.circle}>
        <div className={styles.icon} />
      </div>
      <span className={styles.buttonText}>
        {buttonText}
      </span>
    </button>
  );
}