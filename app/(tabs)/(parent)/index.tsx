import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, LogOut } from 'lucide-react-native';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { saveProgress, defaultProgress } from '@/utils/progress';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const AGE_GROUPS = ['2-4', '5-6', '7-8'] as const;

const SUBJECTS = [
  { label: 'Letters', games: ['alphabet-adventure', 'letter-trace', 'letter-match', 'phonics'] },
  { label: 'Numbers', games: ['counting', 'number-quiz', 'addition'] },
  { label: 'Shapes', games: ['shape-sorter'] },
  { label: 'Colors', games: ['color-paint'] },
  { label: 'Animals', games: ['animal-sounds'] },
  { label: 'Music', games: ['alphabet-adventure'] },
];

function PinDot({ filled }: { filled: boolean }) {
  return (
    <View style={[styles.pinDot, filled && styles.pinDotFilled]} />
  );
}

export default function ParentScreen() {
  const insets = useSafeAreaInsets();
  const { progress, refreshProgress } = useProgress();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePinDigit = (digit: string) => {
    console.log('[ParentScreen] PIN digit pressed:', digit);
    const next = pin + digit;
    if (next.length <= 4) {
      setPin(next);
      if (next.length === 4) {
        if (next === progress.parentPin) {
          console.log('[ParentScreen] PIN correct, unlocking dashboard');
          setUnlocked(true);
          setPin('');
        } else {
          console.log('[ParentScreen] PIN incorrect');
          shake();
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPin(p => p.slice(0, -1));
  };

  const handleLogout = () => {
    console.log('[ParentScreen] Logout pressed');
    setUnlocked(false);
    setPin('');
    setChangingPin(false);
    setNewPin('');
  };

  const handleAgeGroupChange = async (ag: typeof AGE_GROUPS[number]) => {
    console.log('[ParentScreen] Age group changed to:', ag);
    const updated = { ...progress, ageGroup: ag };
    await saveProgress(updated);
    await refreshProgress();
  };

  const handleNewPinDigit = (digit: string) => {
    console.log('[ParentScreen] New PIN digit pressed:', digit);
    const next = newPin + digit;
    if (next.length <= 4) {
      setNewPin(next);
      if (next.length === 4) {
        Alert.alert('Confirm PIN', `Set PIN to ${next}?`, [
          { text: 'Cancel', onPress: () => setNewPin('') },
          {
            text: 'Confirm',
            onPress: async () => {
              console.log('[ParentScreen] PIN changed to:', next);
              const updated = { ...progress, parentPin: next };
              await saveProgress(updated);
              await refreshProgress();
              setChangingPin(false);
              setNewPin('');
              Alert.alert('PIN Changed', 'Your new PIN has been saved!');
            },
          },
        ]);
      }
    }
  };

  const handleResetProgress = () => {
    console.log('[ParentScreen] Reset progress pressed');
    Alert.alert(
      'Reset All Progress?',
      'This will delete all stars, game progress, and streaks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            console.log('[ParentScreen] Progress reset confirmed');
            await saveProgress({ ...defaultProgress, parentPin: progress.parentPin });
            await refreshProgress();
            Alert.alert('Progress Reset', 'All progress has been cleared.');
          },
        },
      ]
    );
  };

  const gamesCompleted = Object.values(progress.games).filter(g => g.completed).length;

  if (!unlocked) {
    return (
      <View style={[styles.pinContainer, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.pinTitle}>Parent Zone 🛡️</Text>
        <Text style={styles.pinSubtitle}>Enter your 4-digit PIN</Text>

        <Animated.View style={[styles.pinDotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map(i => (
            <PinDot key={i} filled={i < pin.length} />
          ))}
        </Animated.View>

        <Text style={styles.pinHint}>Default PIN: 1234</Text>

        <View style={styles.numpad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, ri) => (
            <View key={ri} style={styles.numpadRow}>
              {row.map((digit, di) => (
                <AnimatedPressable
                  key={di}
                  style={[styles.numpadBtn, digit === '' && styles.numpadBtnEmpty]}
                  onPress={() => {
                    if (digit === '⌫') handlePinDelete();
                    else if (digit !== '') handlePinDigit(digit);
                  }}
                  disabled={digit === ''}
                >
                  <Text style={styles.numpadBtnText}>{digit}</Text>
                </AnimatedPressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.dashHeader}>
        <Text style={styles.dashTitle}>Parent Dashboard</Text>
        <AnimatedPressable style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={KIDS_COLORS.textSecondary} />
        </AnimatedPressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Stars', value: progress.totalStars, emoji: '⭐' },
            { label: 'Games Played', value: gamesCompleted, emoji: '🎮' },
            { label: 'Minutes Played', value: progress.totalMinutesPlayed, emoji: '⏱️' },
            { label: 'Day Streak', value: progress.streak, emoji: '🔥' },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Age Group */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age Group</Text>
          <View style={styles.ageRow}>
            {AGE_GROUPS.map(ag => {
              const isSelected = progress.ageGroup === ag;
              return (
                <AnimatedPressable
                  key={ag}
                  style={[styles.ageBtn, isSelected && styles.ageBtnSelected]}
                  onPress={() => handleAgeGroupChange(ag)}
                >
                  <Text style={[styles.ageBtnText, isSelected && styles.ageBtnTextSelected]}>
                    Ages {ag}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Change PIN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          {!changingPin ? (
            <AnimatedPressable
              style={styles.changePinBtn}
              onPress={() => {
                console.log('[ParentScreen] Change PIN pressed');
                setChangingPin(true);
                setNewPin('');
              }}
            >
              <Lock size={18} color={KIDS_COLORS.primary} />
              <Text style={styles.changePinText}>Change PIN</Text>
            </AnimatedPressable>
          ) : (
            <View>
              <Text style={styles.changePinLabel}>Enter new 4-digit PIN:</Text>
              <View style={styles.pinDotsRow}>
                {[0, 1, 2, 3].map(i => (
                  <PinDot key={i} filled={i < newPin.length} />
                ))}
              </View>
              <View style={styles.numpad}>
                {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, ri) => (
                  <View key={ri} style={styles.numpadRow}>
                    {row.map((digit, di) => (
                      <AnimatedPressable
                        key={di}
                        style={[styles.numpadBtnSmall, digit === '' && styles.numpadBtnEmpty]}
                        onPress={() => {
                          if (digit === '⌫') setNewPin(p => p.slice(0, -1));
                          else if (digit !== '') handleNewPinDigit(digit);
                        }}
                        disabled={digit === ''}
                      >
                        <Text style={styles.numpadBtnTextSmall}>{digit}</Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                ))}
              </View>
              <AnimatedPressable
                style={styles.cancelBtn}
                onPress={() => { setChangingPin(false); setNewPin(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </AnimatedPressable>
            </View>
          )}
        </View>

        {/* Subject Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Breakdown</Text>
          {SUBJECTS.map(subject => {
            const practiced = subject.games.some(g => progress.games[g]?.completed);
            return (
              <View key={subject.label} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{subject.label}</Text>
                <View style={[styles.subjectBadge, { backgroundColor: practiced ? KIDS_COLORS.success : KIDS_COLORS.border }]}>
                  <Text style={[styles.subjectBadgeText, { color: practiced ? '#FFFFFF' : KIDS_COLORS.textTertiary }]}>
                    {practiced ? 'Practiced ✓' : 'Not started'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Reset Progress */}
        <AnimatedPressable style={styles.resetBtn} onPress={handleResetProgress}>
          <Text style={styles.resetBtnText}>Reset All Progress</Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    flex: 1,
    backgroundColor: KIDS_COLORS.background,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  pinTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: KIDS_COLORS.text,
    marginBottom: 8,
  },
  pinSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: KIDS_COLORS.textSecondary,
    marginBottom: 32,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: KIDS_COLORS.primary,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: KIDS_COLORS.primary,
  },
  pinHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: KIDS_COLORS.textTertiary,
    marginBottom: 32,
  },
  numpad: {
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  numpadBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: KIDS_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  numpadBtnEmpty: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  numpadBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 28,
    color: KIDS_COLORS.text,
  },
  container: {
    flex: 1,
    backgroundColor: KIDS_COLORS.background,
  },
  dashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dashTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 26,
    color: KIDS_COLORS.text,
  },
  logoutBtn: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: KIDS_COLORS.text,
  },
  statLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: KIDS_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: KIDS_COLORS.text,
    marginBottom: 16,
  },
  ageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ageBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: KIDS_COLORS.background,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: KIDS_COLORS.border,
  },
  ageBtnSelected: {
    backgroundColor: KIDS_COLORS.primary,
    borderColor: KIDS_COLORS.primary,
  },
  ageBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
  },
  ageBtnTextSelected: {
    color: '#FFFFFF',
  },
  changePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: KIDS_COLORS.primaryMuted,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  changePinText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: KIDS_COLORS.primary,
  },
  changePinLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.text,
    marginBottom: 16,
  },
  numpadBtnSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: KIDS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  numpadBtnTextSmall: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 22,
    color: KIDS_COLORS.text,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.textSecondary,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: KIDS_COLORS.divider,
  },
  subjectName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: KIDS_COLORS.text,
  },
  subjectBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  subjectBadgeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  resetBtn: {
    backgroundColor: KIDS_COLORS.danger,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  resetBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
});
