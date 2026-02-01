import { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion } from "framer-motion";

interface InterviewTimerProps {
  durationSeconds: number;
  onComplete?: () => void;
  isActive: boolean;
  onTick?: (secondsElapsed: number) => void;
}

export function InterviewTimer({ durationSeconds, onComplete, isActive, onTick }: InterviewTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next === 0) {
          onComplete?.();
        }
        return next;
      });
      onTick?.(durationSeconds - (secondsLeft - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secondsLeft, durationSeconds, onComplete, onTick]);

  const percentage = (secondsLeft / durationSeconds) * 100;
  const isWarning = secondsLeft <= 10;

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="h-24 w-24 md:h-32 md:w-32"
    >
      <CircularProgressbar
        value={percentage}
        text={`${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`}
        styles={buildStyles({
          textSize: '24px',
          pathTransitionDuration: 0.5,
          pathColor: isWarning ? 'var(--destructive)' : 'var(--primary)',
          textColor: isWarning ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))',
          trailColor: 'hsl(var(--muted))',
        })}
      />
    </motion.div>
  );
}
