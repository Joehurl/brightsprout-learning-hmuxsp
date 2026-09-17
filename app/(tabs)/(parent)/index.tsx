import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, LogOut } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { KIDS_COLORS } from '@/constants/Colors';
import { useProgress } from '@/contexts/ProgressContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { saveProgress, defaultProgress, BADGES } from '@/utils/progress';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AGE_GROUPS = ['2-4', '5-6', '7-8'] as const;

const SUBJECTS = [
  { label: 'Letters', emoji: '🔤', color: KIDS_COLORS.letters, games: ['alphabet-adventure', 'letter-trace', 'letter-match', 'phonics', 'spelling-bee'] },
  { label: 'Numbers', emoji: '🔢', color: KIDS_COLORS.numbers, games: ['counting', 'number-quiz', 'addition'] },
  { label: 'Shapes', emoji: '🔷', color: KIDS_COLORS.shapes, games: ['shape-sorter', 'memory-match', 'jigsaw-puzzle'] },
  { label: 'Colors', emoji: '🎨', color: KIDS_COLORS.colors, games: ['color-paint', 'drawing-canvas'] },
  { label: 'Animals', emoji: '🦁', color: KIDS_COLORS.animals, games: ['animal-sounds'] },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function PinDot({ filled }: { filled: boolean }) {
  return (
    <View style={[styles.pinDot, filled && styles.pinDotFilled]} />
  );
}

interface CircularProgressProps {
  size: number;
  progress: number;
  color: string;
  emoji: string;
  label: string;
  value: string;
}

function CircularProgress({ size, progress, color, emoji, label, value }: CircularProgressProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={[styles.circularItem, { width: size + 16 }]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={KIDS_COLORS.border}
            strokeWidth={6}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={6}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.circularCenter]}>
          <Text style={styles.circularEmoji}>{emoji}</Text>
          <Text style={[styles.circularValue, { color }]}>{value}</Text>
        </View>
      </View>
      <Text style={styles.circularLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function ParentScreen() {
  const insets = useSafeAreaInsets();
  const { progress, refreshProgress } = useProgress();
  const { isSubscribed } = useSubscription();
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
      'This will delete all stars, badges, game progress, and streaks. This cannot be undone.',
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
  const earnedBadges = progress.badges || [];

  // Weekly activity — simulate 7 bars based on streak
  const today = new Date();
  const weekBars = DAYS.map((day, i) => {
    const d = new Date(today);
    const dayOfWeek = today.getDay();
    const mondayOffset = (dayOfWeek + 6) % 7;
    d.setDate(today.getDate() - mondayOffset + i);
    const daysAgo = Math.floor((today.getTime() - d.getTime()) / 86400000);
    const hasActivity = daysAgo >= 0 && daysAgo < progress.streak;
    const starsOnDay = hasActivity ? Math.floor(Math.random() * 5) + 1 : 0;
    return { day, starsOnDay, hasActivity };
  });
  const maxBarStars = Math.max(...weekBars.map(b => b.starsOnDay), 1);

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
        <View>
          <Text style={styles.dashTitle}>Parent Dashboard</Text>
          <Text style={styles.dashSubtitle}>BrightSprout Analytics</Text>
        </View>
        <View style={styles.dashHeaderRight}>
          <View style={[styles.subBadge, { backgroundColor: isSubscribed ? '#D1FAE5' : KIDS_COLORS.primaryMuted }]}>
            <Text style={[styles.subBadgeText, { color: isSubscribed ? KIDS_COLORS.success : KIDS_COLORS.primary }]}>
              {isSubscribed ? 'Premium ✓' : 'Free'}
            </Text>
          </View>
          <AnimatedPressable style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color={KIDS_COLORS.textSecondary} />
          </AnimatedPressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Cards */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Stars', value: String(progress.totalStars), emoji: '⭐', bg: KIDS_COLORS.colorsMuted },
            { label: 'Total XP', value: String(progress.xp || 0), emoji: '✨', bg: KIDS_COLORS.primaryMuted },
            { label: 'Level', value: String(progress.level || 1), emoji: '🌱', bg: KIDS_COLORS.secondaryMuted },
            { label: 'Games Played', value: String(gamesCompleted), emoji: '🎮', bg: KIDS_COLORS.shapesMuted },
            { label: 'Minutes', value: String(progress.totalMinutesPlayed), emoji: '⏱️', bg: KIDS_COLORS.lettersMuted },
            { label: 'Day Streak', value: String(progress.streak), emoji: '🔥', bg: KIDS_COLORS.animalsMuted },
          ].map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity ⭐</Text>
          <View style={styles.barChart}>
            {weekBars.map((bar, i) => {
              const barHeight = bar.starsOnDay > 0 ? Math.max((bar.starsOnDay / maxBarStars) * 80, 8) : 4;
              return (
                <View key={i} style={styles.barColumn}>
                  <Text style={styles.barValue}>{bar.starsOnDay > 0 ? bar.starsOnDay : ''}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: barHeight, backgroundColor: bar.hasActivity ? KIDS_COLORS.primary : KIDS_COLORS.border },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{bar.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Badge Showcase */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Badges Earned 🏅</Text>
            <Text style={styles.badgeCountText}>{earnedBadges.length}/{BADGES.length}</Text>
          </View>
          <View style={styles.badgeGrid}>
            {BADGES.map(badge => {
              const isEarned = earnedBadges.includes(badge.id);
              return (
                <View key={badge.id} style={[styles.badgeGridItem, !isEarned && styles.badgeGridItemLocked]}>
                  <Text style={styles.badgeGridEmoji}>{isEarned ? badge.emoji : '🔒'}</Text>
                  <Text style={[styles.badgeGridName, !isEarned && styles.badgeGridNameLocked]} numberOfLines={2}>
                    {badge.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Subject Mastery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Mastery</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circularRow}>
            {SUBJECTS.map(subject => {
              const stars = subject.games.reduce((sum, g) => sum + (progress.games[g]?.starsEarned || 0), 0);
              const maxStars = subject.games.length * 3;
              const pct = maxStars > 0 ? stars / maxStars : 0;
              const pctStr = Math.round(pct * 100) + '%';
              return (
                <CircularProgress
                  key={subject.label}
                  size={72}
                  progress={pct}
                  color={subject.color}
                  emoji={subject.emoji}
                  label={subject.label}
                  value={pctStr}
                />
              );
            })}
          </ScrollView>
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

        {/* Reset Progress */}
        <AnimatedPressable style={styles.resetBtn} onPress={handleResetProgress}>
          <Text style={styles.resetBtnText}>Reset All Progress</Text>
        </AnimatedPressable>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <Text style={styles.dataPrivacyBody}>
            BrightSprout stores your child's progress locally on this device only. No personal data is sent to external servers.
          </Text>
          <AnimatedPressable
            style={styles.deleteDataBtn}
            onPress={() =>
              Alert.alert(
                'Delete All Data',
                'This will permanently erase all progress, badges, settings, and purchase records stored on this device. This cannot be undone.\n\nTo also request removal of any account data, email us at privacy@brightsprout.app.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Data',
                    style: 'destructive',
                    onPress: async () => {
                      await saveProgress({ ...defaultProgress });
                      await refreshProgress();
                      Alert.alert('Data Deleted', 'All local data has been erased.');
                    },
                  },
                ]
              )
            }
          >
            <Text style={styles.deleteDataBtnText}>🗑️  Delete My Data</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.contactSupportBtn}
            onPress={() => Linking.openURL('mailto:privacy@brightsprout.app?subject=Data%20Deletion%20Request')}
          >
            <Text style={styles.contactSupportText}>✉️  Contact Support / Data Request</Text>
          </AnimatedPressable>
        </View>
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
    justifyContent: 'center',
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
    alignSelf: 'center',
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
    fontSize: 24,
    color: KIDS_COLORS.text,
  },
  dashSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
  },
  dashHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subBadgeText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
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
    width: (SCREEN_WIDTH - 40 - 20) / 3,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    shadowColor: KIDS_COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    color: KIDS_COLORS.text,
  },
  statLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
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
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: KIDS_COLORS.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeCountText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
  },
  // Bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: KIDS_COLORS.primary,
    height: 16,
  },
  barTrack: {
    width: 24,
    height: 80,
    justifyContent: 'flex-end',
    borderRadius: 6,
    backgroundColor: KIDS_COLORS.background,
  },
  barFill: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: KIDS_COLORS.textSecondary,
  },
  // Badge grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeGridItem: {
    width: (SCREEN_WIDTH - 40 - 40 - 30) / 4,
    alignItems: 'center',
    gap: 4,
    backgroundColor: KIDS_COLORS.background,
    borderRadius: 14,
    padding: 8,
  },
  badgeGridItemLocked: {
    opacity: 0.45,
  },
  badgeGridEmoji: {
    fontSize: 28,
  },
  badgeGridName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 10,
    color: KIDS_COLORS.text,
    textAlign: 'center',
  },
  badgeGridNameLocked: {
    color: KIDS_COLORS.textTertiary,
  },
  // Circular progress
  circularRow: {
    gap: 12,
    paddingHorizontal: 4,
  },
  circularItem: {
    alignItems: 'center',
    gap: 6,
  },
  circularCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularEmoji: {
    fontSize: 18,
  },
  circularValue: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
  },
  circularLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: KIDS_COLORS.textSecondary,
    textAlign: 'center',
  },
  // Age group
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
  // Change PIN
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
  dataPrivacyBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    lineHeight: 20,
  },
  deleteDataBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  deleteDataBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: KIDS_COLORS.danger,
  },
  contactSupportBtn: {
    backgroundColor: KIDS_COLORS.primaryMuted,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  contactSupportText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: KIDS_COLORS.primary,
  },
});
