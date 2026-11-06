import confetti from 'canvas-confetti';

export const triggerTiebreakerConfetti = () => {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'],
    });
  } catch (e) {
    console.error('Confetti error', e);
  }
};
