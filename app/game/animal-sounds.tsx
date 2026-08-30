import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GameCompleteOverlay } from '@/components/GameCompleteOverlay';
import { playSound } from '@/utils/sounds';

interface AnimalChoice {
  emoji: string;
  name: string;
}

interface AnimalQuestion {
  sound: string;
  correct: AnimalChoice;
  wrong: AnimalChoice[];
  fact: string;
}

const ANIMAL_QUESTIONS: AnimalQuestion[] = [
  { sound: 'ROAR! 🦁', correct: { emoji: '🦁', name: 'Lion' }, wrong: [{ emoji: '🐘', name: 'Elephant' }, { emoji: '🐧', name: 'Penguin' }], fact: 'Lions are called the King of the Jungle!' },
  { sound: 'MOO! 🐄', correct: { emoji: '🐄', name: 'Cow' }, wrong: [{ emoji: '🐷', name: 'Pig' }, { emoji: '🐑', name: 'Sheep' }], fact: 'Cows can recognize their friends!' },
  { sound: 'WOOF! 🐶', correct: { emoji: '🐶', name: 'Dog' }, wrong: [{ emoji: '🐱', name: 'Cat' }, { emoji: '🐰', name: 'Rabbit' }], fact: 'Dogs can smell 100,000 times better than humans!' },
  { sound: 'MEOW! 🐱', correct: { emoji: '🐱', name: 'Cat' }, wrong: [{ emoji: '🐶', name: 'Dog' }, { emoji: '🐭', name: 'Mouse' }], fact: 'Cats sleep up to 16 hours a day!' },
  { sound: 'OINK! 🐷', correct: { emoji: '🐷', name: 'Pig' }, wrong: [{ emoji: '🐄', name: 'Cow' }, { emoji: '🐑', name: 'Sheep' }], fact: 'Pigs are very smart animals!' },
  { sound: 'NEIGH! 🐴', correct: { emoji: '🐴', name: 'Horse' }, wrong: [{ emoji: '🦌', name: 'Deer' }, { emoji: '🦒', name: 'Giraffe' }], fact: 'Horses can sleep standing up!' },
  { sound: 'RIBBIT! 🐸', correct: { emoji: '🐸', name: 'Frog' }, wrong: [{ emoji: '🐊', name: 'Crocodile' }, { emoji: '🦎', name: 'Lizard' }], fact: 'Frogs drink water through their skin!' },
  { sound: 'HOOT! 🦉', correct: { emoji: '🦉', name: 'Owl' }, wrong: [{ emoji: '🐦', name: 'Bird' }, { emoji: '🦅', name: 'Eagle' }], fact: 'Owls can turn their heads almost all the way around!' },
  { sound: 'BUZZ! 🐝', correct: { emoji: '🐝', name: 'Bee' }, wrong: [{ emoji: '🦋', name: 'Butterfly' }, { emoji: '🐛', name: 'Caterpillar' }], fact: 'Bees make honey to feed their family!' },
  { sound: 'TRUMPET! 🐘', correct: { emoji: '🐘', name: 'Elephant' }, wrong: [{ emoji: '🦏', name: 'Rhino' }, { emoji: '🦛', name: 'Hippo' }], fact: 'Elephants never forget — they have amazing memories!' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AnimalSoundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGame } = useProgress();

  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFact, setShowFact] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const shakeAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const flashAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const question = ANIMAL_QUESTIONS[qIndex];
  const choices = shuffle([question.correct, ...question.wrong]);

  const handleAnswer = async (choice: AnimalChoice, choiceIndex: number) => {
    if (answered) return;
    const isCorrect = choice.name === question.correct.name;
    console.log('[AnimalSounds] Answer selected:', choice.name, 'correct:', isCorrect);
    playSound('tap');
    setAnswered(true);
    setSelectedChoice(choice.name);
    playSound(isCorrect ? 'correct' : 'wrong');

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    if (isCorrect) {
      Animated.spring(flashAnims[choiceIndex], { toValue: 1, useNativeDriver: false }).start();
      setShowFact(true);
      setTimeout(async () => {
        flashAnims[choiceIndex].setValue(0);
        setShowFact(false);
        if (qIndex >= 9) {
          const stars = newScore >= 8 ? 3 : newScore >= 5 ? 2 : 1;
          await completeGame('animal-sounds', stars);
          setShowComplete(true);
        } else {
          setQIndex(i => i + 1);
          setAnswered(false);
          setSelectedChoice(null);
        }
      }, 2000);
    } else {
      Animated.sequence([
        Animated.timing(shakeAnims[choiceIndex], { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[choiceIndex], { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[choiceIndex], { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnims[choiceIndex], { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        shakeAnims.forEach(a => a.setValue(0));
        setAnswered(false);
        setSelectedChoice(null);
      }, 1200);
    }
  };

  const handlePlayAgain = () => {
    console.log('[AnimalSounds] Play again pressed');
    setShowComplete(false);
    setQIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedChoice(null);
    setShowFact(false);
  };

  const stars = score >= 8 ? 3 : score >= 5 ? 2 : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.backBtn}
          onPress={() => {
            console.log('[AnimalSounds] Back pressed');
            router.back();
          }}
        >
          <ChevronLeft size={28} color={KIDS_COLORS.animals} />
        </AnimatedPressable>
        <Text style={styles.title}>Animal Sounds 🦁</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}/{qIndex}</Text>
        </View>
      </View>

      <View style={styles.soundArea}>
        <Text style={styles.soundLabel}>🔊 This animal says...</Text>
        <Text style={styles.soundText}>{question.sound}</Text>
      </View>

      {showFact && (
        <View style={styles.factBanner}>
          <Text style={styles.factText}>🌟 {question.fact}</Text>
        </View>
      )}

      <View style={styles.choicesRow}>
        {choices.map((choice, i) => {
          const bgColor = flashAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [KIDS_COLORS.surface, '#D1FAE5'],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.choiceCard,
                { transform: [{ translateX: shakeAnims[i] }], backgroundColor: bgColor },
              ]}
            >
              <AnimatedPressable
                onPress={() => handleAnswer(choice, i)}
                style={styles.choiceInner}
              >
                <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
                <Text style={styles.choiceName}>{choice.name}</Text>
              </AnimatedPressable>
            </Animated.View>
          );
        })}
      </View>

      <Text style={styles.progress}>Question {qIndex + 1} of 10</Text>

      <GameCompleteOverlay
        visible={showComplete}
        stars={stars}
        message={score >= 8 ? 'Animal Expert!' : 'Great listening!'}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KIDS_COLORS.animalsMuted,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KIDS_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: KIDS_COLORS.text,
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: KIDS_COLORS.animals,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  soundArea: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    flex: 1,
    justifyContent: 'center',
  },
  soundLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: KIDS_COLORS.textSecondary,
    marginBottom: 12,
  },
  soundText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 48,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  factBanner: {
    backgroundColor: KIDS_COLORS.animalsMuted,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: KIDS_COLORS.animals,
  },
  factText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  choicesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  choiceCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  choiceInner: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  choiceEmoji: {
    fontSize: 48,
  },
  choiceName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  progress: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
