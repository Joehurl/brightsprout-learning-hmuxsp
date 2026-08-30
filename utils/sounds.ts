import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type SoundType =
  | 'correct'
  | 'wrong'
  | 'star'
  | 'complete'
  | 'tap'
  | 'flip'
  | 'pop'
  | 'levelup';

export async function playSound(type: SoundType): Promise<void> {
  console.log('[Sound] playSound:', type);

  if (Platform.OS !== 'web') {
    try {
      switch (type) {
        case 'correct':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'wrong':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'star':
        case 'complete':
        case 'levelup':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await new Promise(r => setTimeout(r, 100));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'tap':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'flip':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'pop':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (e) {
      // Silently fail if haptics not available
    }
    return;
  }

  // Web Audio API implementation
  try {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      oscType: OscillatorType = 'sine',
      gain = 0.3,
    ) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(gain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    switch (type) {
      case 'correct':
        playTone(523, now, 0.15);
        playTone(659, now + 0.1, 0.15);
        playTone(784, now + 0.2, 0.2);
        break;
      case 'wrong':
        playTone(300, now, 0.1, 'sawtooth', 0.2);
        playTone(250, now + 0.1, 0.15, 'sawtooth', 0.2);
        break;
      case 'star':
        playTone(880, now, 0.08);
        playTone(1047, now + 0.08, 0.08);
        playTone(1319, now + 0.16, 0.12);
        break;
      case 'complete':
        playTone(523, now, 0.1);
        playTone(659, now + 0.1, 0.1);
        playTone(784, now + 0.2, 0.1);
        playTone(1047, now + 0.3, 0.3);
        break;
      case 'levelup':
        [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => {
          playTone(f, now + i * 0.07, 0.15);
        });
        break;
      case 'tap':
        playTone(800, now, 0.05, 'sine', 0.15);
        break;
      case 'flip':
        playTone(400, now, 0.05, 'sine', 0.2);
        playTone(600, now + 0.05, 0.08, 'sine', 0.15);
        break;
      case 'pop':
        playTone(600, now, 0.03, 'sine', 0.25);
        playTone(400, now + 0.03, 0.05, 'sine', 0.15);
        break;
    }
  } catch (e) {
    // Silently fail if Web Audio not available
  }
}
