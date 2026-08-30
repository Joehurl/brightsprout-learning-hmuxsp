/**
 * BrightSprout Paywall Screen
 * Beautiful kids-themed paywall with animated hero section.
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

// Free games (one per category) — all others require premium
const FREE_GAMES = ["alphabet-adventure", "counting", "shape-sorter", "color-paint", "animal-sounds"];

const FEATURES = [
  { emoji: "⭐", text: "10 Interactive Learning Games" },
  { emoji: "🔤", text: "Letters, Numbers, Shapes & More" },
  { emoji: "🏆", text: "Stars & Rewards System" },
  { emoji: "📊", text: "Parent Progress Dashboard" },
  { emoji: "🔄", text: "New Games Added Regularly" },
];

const FLOATING_EMOJIS = ["🔤", "📚", "🔢", "🎨", "🦁", "🎵"];

// Positions for the 6 floating emojis arranged in a circle around the mascot
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
  const [cancelExpanded, setCancelExpanded] = useState(false);

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0]);
    }
  }, [packages]);

  const handleClose = () => {
    console.log("[Paywall] Close button pressed");
    router.replace("/(tabs)/(home)");
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    console.log("[Paywall] Subscribe button pressed, package:", selectedPackage.identifier);
    try {
      setPurchasing(true);
      const success = await purchasePackage(selectedPackage);
      console.log("[Paywall] Purchase result:", success);
      if (success) {
        Alert.alert("Welcome to BrightSprout Premium! 🌱", "All learning adventures are now unlocked!", [
          { text: "Let's Go! 🚀", onPress: () => router.replace("/(tabs)/(home)") },
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
    console.log("[Paywall] Restore purchases pressed");
    try {
      setRestoring(true);
      const restored = await restorePurchases();
      console.log("[Paywall] Restore result:", restored);
      if (restored) {
        Alert.alert("Restored! 🎉", "Your subscription has been restored.", [
          { text: "OK", onPress: () => router.replace("/(tabs)/(home)") },
        ]);
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases to restore.");
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

  const handleToggleCancel = () => {
    console.log("[Paywall] Cancel info toggled");
    setCancelExpanded((prev) => !prev);
  };

  // Already subscribed
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
          <View style={styles.subscribedContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.subscribedTitle}>You're Premium!</Text>
            <Text style={styles.subscribedSubtitle}>All learning adventures are unlocked!</Text>
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

  // Derive price string for the CTA button
  const priceString = selectedPackage?.product?.priceString ?? "$2.99";
  const ctaLabel = purchasing ? "" : `Start Learning — ${priceString}/month`;

  const cancelPlatformText = Platform.OS === "ios"
    ? "On iPhone: Settings → Apple ID → Subscriptions → BrightSprout → Cancel."
    : "On Android: Play Store → Subscriptions → BrightSprout → Cancel.";

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
                <Text style={styles.heroSubtitle}>Premium Learning</Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── Content ── */}
          <View style={styles.content}>
            {/* Headline */}
            <Text style={styles.headline}>Unlock All Learning Adventures! 🚀</Text>

            {/* Feature bullets */}
            <View style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconCircle}>
                    <Text style={styles.featureIconText}>{f.emoji}</Text>
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Subscribe CTA */}
            {isWeb ? (
              <AnimatedPressable style={styles.subscribeBtn} onPress={handleWebMockPurchase}>
                <Text style={styles.subscribeBtnText}>Start Learning — $2.99/month</Text>
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                style={[styles.subscribeBtn, (purchasing || !selectedPackage) && styles.btnDisabled]}
                onPress={handlePurchase}
                disabled={purchasing || !selectedPackage}
              >
                {purchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.subscribeBtnText}>{ctaLabel}</Text>
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

            {/* Cancel anytime note */}
            <Text style={styles.cancelNote}>
              Cancel anytime in {Platform.OS === "ios" ? "App Store" : "Play Store"} settings
            </Text>

            {/* Restore Purchases */}
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
              {restoring ? (
                <ActivityIndicator size="small" color={KIDS_COLORS.textSecondary} />
              ) : (
                <Text style={styles.restoreBtnText}>Restore Purchases</Text>
              )}
            </TouchableOpacity>

            {/* How to Cancel info card */}
            <TouchableOpacity style={styles.cancelCard} onPress={handleToggleCancel} activeOpacity={0.8}>
              <View style={styles.cancelCardHeader}>
                <Text style={styles.cancelCardTitle}>Easy Cancellation 🔓</Text>
                <Text style={styles.cancelCardChevron}>{cancelExpanded ? "▲" : "▼"}</Text>
              </View>
              {cancelExpanded && (
                <Text style={styles.cancelCardBody}>
                  {`Cancel anytime — no questions asked.\n\n${cancelPlatformText}`}
                </Text>
              )}
            </TouchableOpacity>

            {/* Legal */}
            <Text style={styles.legalText}>
              {Platform.OS === "ios"
                ? "Payment charged to Apple ID. Subscription renews unless cancelled 24h before period end."
                : "Payment charged to Google Play account. Subscription renews unless cancelled 24h before period end."}
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
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  // ── Content ──
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  headline: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 26,
    color: KIDS_COLORS.text,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 34,
  },

  // Feature list
  featureList: {
    gap: 14,
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

  // Subscribe button
  subscribeBtn: {
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
  subscribeBtnText: {
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

  // Cancel note
  cancelNote: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },

  // Restore
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 20,
  },
  restoreBtnText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    color: KIDS_COLORS.textSecondary,
    textDecorationLine: "underline",
  },

  // Cancel info card
  cancelCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cancelCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelCardTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: KIDS_COLORS.text,
  },
  cancelCardChevron: {
    fontSize: 12,
    color: KIDS_COLORS.textSecondary,
  },
  cancelCardBody: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: KIDS_COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 10,
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

  // Subscribed state
  subscribedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  celebrationEmoji: {
    fontSize: 80,
  },
  subscribedTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 32,
    color: "#fff",
    textAlign: "center",
  },
  subscribedSubtitle: {
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
