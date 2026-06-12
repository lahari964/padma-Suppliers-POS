export const playNotificationSound = (soundType: string) => {
  if (soundType === 'None' || soundType === 'Silent') return;

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (soundType) {
    case 'Water Drop':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'Pop':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'Bell':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      // Add a slight harmonic
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now);
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      gainNode2.gain.setValueAtTime(0, now);
      gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      
      osc.start(now);
      osc.stop(now + 1.5);
      osc2.start(now);
      osc2.stop(now + 1.0);
      break;

    case 'Ping':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;

    case 'Default':
    default:
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
  }
};
