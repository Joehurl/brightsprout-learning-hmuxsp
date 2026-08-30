/**
 * BrightSprout Paywall Screen
 * One-time lifetime purchase — pay once, own forever.
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { KIDS_COLORS } from "@/constants/Colors";
import { Mascot } from "@/components/Mascot";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Free games — always playable without purchase
const FREE_GAMES_LIST = [
  "Alphabet Adventure",
  "Counting Stars",
  "Shape Sorter",
  "Color Mixing",
  "Animal Sounds",
];

// What unlocks with the one-time purchase
const UNLOCK_FEATURES = [
  { emoji: "🎮", text: "14 games total — all games" },
  { emoji: "🏆", text: "Badges & rewards system" },
  { emoji: "📊", text: "Parent progress dashboard" },
  { emoji: "🔮", text: "All future games included" },
  { emoji: "♾️", text: "One-time payment — yours forever" },
];

const FLOATING_EMOJIS = ["🔤", "📚", "🔢", "🎨", "🦁", "🎵"];

const FLOAT_POSITIONS = [
  { top: 20, left: SCREEN_WIDTH / 2 - 120 },
  { top: 20, left: SCREEN_WIDTH / 2 + 60 },
  { top: 90, left: SCREEN_WIDTH / 2 - 150 },
  { top: 90, left: SCREEN_WIDTH / 2 + 90 },
  { top: 160, left: SCREEN_WIDTH / 2 - 120 },
  { top: 160, left: SCREEN_WIDTH / 2 + 60 },
];

function FloatingEmoji({ emoji, position, delay }: { emoji: string; position: { top: number; left: number }; delay: number }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1800, delay, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingEmoji,
        { top: position.top, left: position.left, transform: [{ translateY: floatAnim }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const {
    packages,
    loading,
    isSubscribed,
    isWeb,
    purchasePackage,
    restorePurchases,
    mockWebPurchase,
    mockNativePurchase,
  } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0]);
    }
  }, [packages]);

  const handleClose = () => {
    console.log("[Paywall] Close button pressed — returning to home (free preview)");
    router.replace("/(tabs)/(home)");
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    console.log("[Paywall] Unlock button pressed, package:", selectedPackage.identifier);
    try {
      setPurchasing(true);
      const success = await purchasePackage(selectedPackage);
      console.log("[Paywall] Purchase result:", success);
      if (success) {
        Alert.alert("You Own BrightSprout! 🎉", "All 14 games are now unlocked forever!", [
          { text: "Start Learning 🚀", onPress: () => router.replace("/(tabs)/(home)") },
        ]);
      }
    } catch (error: any) {
      console.log("[Paywall] Purchase error:", error?.message);
      Alert.alert("Oops! Something went wrong.", "Please try again.", [{ text: "OK" }]);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    console.log("[Paywall] Restore purchase pressed");
    try {
      setRestoring(true);
      const restored = await restorePurchases();
      console.log("[Paywall] Restore result:", restored);
      if (restored) {
        Alert.alert("Restored! 🎉", "Your purchase has been restored.", [
          { text: "Start Learning 🚀", onPress: () => router.replace("/(tabs)/(home)") },
        ]);
      } else {
        Alert.alert("No Purchase Found", "We couldn't find a previous purchase to restore.");
      }
    } catch (error: any) {
      console.log("[Paywall] Restore error:", error?.message);
      Alert.alert("Oops! Something went wrong.", "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const handleWebMockPurchase = async () => {
    console.log("[Paywall] Web mock purchase pressed");
    mockWebPurchase();
    router.replace("/(tabs)/(home)");
  };

  // Already purchased / unlocked
  if (isSubscribed) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#FF6B35", "#FFD93D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.ownedContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.ownedTitle}>You Own BrightSprout!</Text>
            <Text style={styles.ownedSubtitle}>All 14 games are unlocked forever!</Text>
            <AnimatedPressable style={styles.exploreBtn} onPress={handleClose}>
              <Text style={styles.exploreBtnText}>Start Learning 🚀</Text>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#FF6B35", "#FFD93D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const priceString = selectedPackage?.product?.priceString ?? "$4.99";
  const ctaLabel = purchasing ? "" : `Unlock Everything — ${priceString}`;
  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Section ── */}
          <View style={styles.heroWrapper}>
            <LinearGradient
              colors={["#FF6B35", "#FFD93D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              {/* Close button */}
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>

              {/* Floating learning emojis */}
              {FLOATING_EMOJIS.map((emoji, i) => (
                <FloatingEmoji
                  key={i}
                  emoji={emoji}
                  position={FLOAT_POSITIONS[i]}
                  delay={i * 300}
                />
              ))}

              {/* Mascot */}
              <View style={styles.heroCenter}>
                <Mascot size={110} animate={true} expression="excited" />
                <Text style={styles.heroTitle}>BrightSprout</Text>
                <Text style={styles.heroSubtitle}>Own it forever 🌱</Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── Content ── */}
          <View style={styles.content}>

            {/* Free preview card */}
            <View style={styles.freePreviewCard}>
              <Text style={styles.freePreviewTitle}>✅ Free Forever</Text>
              <Text style={styles.freePreviewSubtitle}>5 games — no purchase needed</Text>
              <View style={styles.freeGamesList}>
                {FREE_GAMES_LIST.map((name, i) => (
                  <View key={i} style={styles.freeGameRow}>
                    <Text style={styles.freeGameBullet}>•</Text>
                    <Text style={styles.freeGameName}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Unlock everything section */}
            <Text style={styles.unlockHeadline}>Unlock Everything 🔓</Text>
            <View style={styles.featureList}>
              {UNLOCK_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconCircle}>
                    <Text style={styles.featureIconText}>{f.emoji}</Text>
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Price badge */}
            <View style={styles.priceBadgeWrapper}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeAmount}>$4.99</Text>
              </View>
              <Text style={styles.priceTagline}>One-time purchase • No subscription • No recurring charges</Text>
              <Text style={styles.priceOwnership}>Own BrightSprout forever — pay once, play always</Text>
            </View>

            {/* CTA button */}
            {isWeb ? (
              <AnimatedPressable style={styles.unlockBtn} onPress={handleWebMockPurchase}>
                <Text style={styles.unlockBtnText}>Unlock Everything — $4.99</Text>
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                style={[styles.unlockBtn, (purchasing || !selectedPackage) && styles.btnDisabled]}
                onPress={handlePurchase}
                disabled={purchasing || !selectedPackage}
              >
                {purchasing ? (
                  <ActivityIndicator color={KIDS_COLORS.text} />
                ) : (
                  <Text style={styles.unlockBtnText}>{ctaLabel}</Text>
                )}
              </AnimatedPressable>
            )}

            {/* No packages in Expo Go */}
            {!isWeb && packages.length === 0 && !loading && (
              <View style={styles.noPackagesBox}>
                <Text style={styles.noPackagesText}>
                  Purchases require a development or production build.
                </Text>
                {__DEV__ && (
                  <TouchableOpacity
                    style={styles.devMockBtn}
                    onPress={async () => {
                      console.log("[Paywall] Dev simulate purchase pressed");
                      await mockNativePurchase();
                      router.replace("/(tabs)/(home)");
                    }}
                  >
                    <Text style={styles.devMockBtnText}>Dev: Simulate Purchase</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Restore Purchase */}
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
              {restoring ? (
                <ActivityIndicator size="small" color={KIDS_COLORS.textSecondary} />
              ) : (
                <Text style={styles.restoreBtnText}>Restore Purchase</Text>
              )}
            </TouchableOpacity>

            {/* Legal */}
            <Text style={styles.legalText}>
              {`One-time purchase. Payment processed by ${storeName}. No recurring charges.`}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KIDS_COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },

  // ── Hero ──
  heroWrapper: {
    width: "100%",
  },
  hero: {
    width: "100%",
    height: 280,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 24,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Nunito_700Bold",
  },
  floatingEmoji: {
    position: "absolute",
    fontSize: 28,
  },
  heroCenter: {
    alignItems: "center",
    zIndex: 5,
  },
  heroTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 32,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // ── Content ──
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // Free preview card
  freePreviewCard: {
    backgroundColor: KIDS_COLORS.secondaryMuted,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: KIDS_COLORS.secondary,
  },
  freePreviewTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 17,
    color: KIDS_COLORS.text,
    marginBottom: 2,
  },
  freePreviewSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
    marginBottom: 12,
  },
  freeGamesList: {
    gap: 4,
  },
  freeGameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  freeGameBullet: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: KIDS_COLORS.secondary,
  },
  freeGameName: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: KIDS_COLORS.text,
  },

  // Unlock section
  unlockHeadline: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 22,
    color: KIDS_COLORS.text,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KIDS_COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconText: {
    fontSize: 22,
  },
  featureText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
    color: KIDS_COLORS.text,
    flex: 1,
  },

  // Price badge
  priceBadgeWrapper: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  priceBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: KIDS_COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: KIDS_COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 4,
  },
  priceBadgeAmount: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 34,
    color: KIDS_COLORS.text,
  },
  priceTagline: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  priceOwnership: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: KIDS_COLORS.text,
    textAlign: "center",
  },

  // Unlock button
  unlockBtn: {
    backgroundColor: KIDS_COLORS.primary,
    borderRadius: 20,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: KIDS_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  unlockBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 20,
    color: "#fff",
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // No packages
  noPackagesBox: {
    backgroundColor: KIDS_COLORS.primaryMuted,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  noPackagesText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: KIDS_COLORS.textSecondary,
    textAlign: "center",
  },
  devMockBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KIDS_COLORS.primary,
    borderStyle: "dashed",
  },
  devMockBtnText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: KIDS_COLORS.primary,
  },

  // Restore
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 16,
  },
  restoreBtnText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    color: KIDS_COLORS.textSecondary,
    textDecorationLine: "underline",
  },

  // Legal
  legalText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: KIDS_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 8,
  },

  // Owned state
  ownedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  celebrationEmoji: {
    fontSize: 80,
  },
  ownedTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
  },
  ownedSubtitle: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  exploreBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    marginTop: 8,
  },
  exploreBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 20,
    color: "#fff",
  },
});
