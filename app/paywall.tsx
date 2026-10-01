/**
 * BrightSprout Paywall Screen
 * Monthly or Annual subscription.
 */

import React, { useRef, useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
// import type is erased at compile time — it never causes the native module to be
// evaluated at runtime, so this is safe on web even though react-native-purchases
// has no web shim.
import type { PurchasesPackage } from "react-native-purchases";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { KIDS_COLORS } from "@/constants/Colors";
import { Mascot } from "@/components/Mascot";

const PRIVACY_POLICY_URL = "https://brightsprout.app/privacy";
const TERMS_URL = "https://brightsprout.app/terms";

// What unlocks with purchase
const UNLOCK_FEATURES = [
  { emoji: "🎮", text: "14 games total — all games" },
  { emoji: "🏆", text: "Badges & rewards system" },
  { emoji: "📊", text: "Parent progress dashboard" },
  { emoji: "🔮", text: "All future games included" },
  { emoji: "💰", text: "Annual plan saves 79% vs monthly" },
];

const FLOATING_EMOJIS = ["🔤", "📚", "🔢", "🎨", "🦁", "🎵"];

function isMonthlyPackage(pkg: PurchasesPackage): boolean {
  const id = pkg.identifier.toLowerCase();
  return id.includes("monthly") || id.includes("$rc_monthly");
}

function isAnnualPackage(pkg: PurchasesPackage): boolean {
  const id = pkg.identifier.toLowerCase();
  return id.includes("annual") || id.includes("yearly") || id.includes("$rc_annual");
}

function FloatingEmoji({
  emoji,
  position,
  delay,
}: {
  emoji: string;
  position: { top: number; left: number };
  delay: number;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1800,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingEmoji,
        {
          top: position.top,
          left: position.left,
          transform: [{ translateY: floatAnim }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function PaywallScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const FLOAT_POSITIONS = [
    { top: 20, left: SCREEN_WIDTH / 2 - 120 },
    { top: 20, left: SCREEN_WIDTH / 2 + 60 },
    { top: 90, left: SCREEN_WIDTH / 2 - 150 },
    { top: 90, left: SCREEN_WIDTH / 2 + 90 },
    { top: 160, left: SCREEN_WIDTH / 2 - 120 },
    { top: 160, left: SCREEN_WIDTH / 2 + 60 },
  ];

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

  const [planType, setPlanType] = useState<"monthly" | "annual">("annual");
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Derive monthly and annual packages from RC packages array
  const monthlyPkg = packages.find(isMonthlyPackage) ?? null;
  const annualPkg = packages.find(isAnnualPackage) ?? null;

  // Auto-select annual package on load; fall back to monthly if only that exists
  useEffect(() => {
    if (packages.length === 0) return;
    if (annualPkg) {
      setPlanType("annual");
      setSelectedPackage(annualPkg);
    } else if (monthlyPkg) {
      setPlanType("monthly");
      setSelectedPackage(monthlyPkg);
    }
  }, [packages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlan = (type: "monthly" | "annual") => {
    const pkg = type === "monthly" ? monthlyPkg : annualPkg;
    console.log("[Paywall] Plan card tapped:", type, "package:", pkg?.identifier ?? "unavailable");
    setPlanType(type);
    setSelectedPackage(pkg);
  };

  const handleClose = () => {
    console.log("[Paywall] Close button pressed — returning to home (free preview)");
    router.replace("/(tabs)/(home)");
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    console.log(
      "[Paywall] Unlock button pressed, plan:",
      planType,
      "package:",
      selectedPackage.identifier
    );
    try {
      setPurchasing(true);
      const success = await purchasePackage(selectedPackage);
      console.log("[Paywall] Purchase result:", success);
      if (success) {
        const title = "BrightSprout Unlocked! 🎉";
        const message =
          planType === "monthly"
            ? "All 14 games are now unlocked!"
            : "All 14 games are now unlocked for a year!";
        Alert.alert(title, message, [
          {
            text: "Start Learning 🚀",
            onPress: () => router.replace("/(tabs)/(home)"),
          },
        ]);
      }
    } catch (error: any) {
      console.log("[Paywall] Purchase error:", error?.message);
      Alert.alert("Oops! Something went wrong.", "Please try again.", [
        { text: "OK" },
      ]);
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
          {
            text: "Start Learning 🚀",
            onPress: () => router.replace("/(tabs)/(home)"),
          },
        ]);
      } else {
        Alert.alert(
          "No Purchase Found",
          "We couldn't find a previous purchase to restore."
        );
      }
    } catch (error: any) {
      console.log("[Paywall] Restore error:", error?.message);
      Alert.alert("Oops! Something went wrong.", "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const handleWebMockPurchase = async () => {
    console.log("[Paywall] Web mock purchase pressed, plan:", planType);
    mockWebPurchase();
    router.replace("/(tabs)/(home)");
  };

  // Derive CTA label
  const monthlyPrice = monthlyPkg?.product?.priceString ?? "$1.99";
  const annualPrice = annualPkg?.product?.priceString ?? "$4.99";
  const ctaLabel =
    planType === "monthly"
      ? `Start Monthly — ${monthlyPrice}/mo`
      : `Start Annual — ${annualPrice}/yr`;

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
            <Text style={styles.ownedTitle}>BrightSprout Unlocked!</Text>
            <Text style={styles.ownedSubtitle}>
              All 14 games are now unlocked!
            </Text>
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

  const isMonthlySelected = planType === "monthly";
  const isAnnualSelected = planType === "annual";
  const monthlyUnavailable = !monthlyPkg;
  const annualUnavailable = !annualPkg;

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
                <Text style={styles.heroSubtitle}>Unlock everything 🌱</Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── Content ── */}
          <View style={styles.content}>
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

            {/* ── Plan Cards ── */}
            <Text style={styles.choosePlanLabel}>Choose your plan</Text>

            {/* Monthly Card */}
            <TouchableOpacity
              style={[
                styles.planCard,
                isMonthlySelected && styles.planCardSelected,
                monthlyUnavailable && styles.planCardDisabled,
              ]}
              onPress={() => handleSelectPlan("monthly")}
              disabled={monthlyUnavailable}
              activeOpacity={0.8}
            >
              {/* Radio */}
              <View
                style={[
                  styles.radioOuter,
                  isMonthlySelected && styles.radioOuterSelected,
                ]}
              >
                {isMonthlySelected && <View style={styles.radioInner} />}
              </View>

              {/* Plan info */}
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planTagline}>Cancel anytime</Text>
              </View>

              {/* Price */}
              <View style={styles.planPriceBlock}>
                <Text style={styles.planPrice}>{monthlyPrice}</Text>
                <Text style={styles.planPricePer}>/month</Text>
              </View>
            </TouchableOpacity>

            {/* Annual Card */}
            <TouchableOpacity
              style={[
                styles.planCard,
                isAnnualSelected && styles.planCardSelected,
                annualUnavailable && styles.planCardDisabled,
              ]}
              onPress={() => handleSelectPlan("annual")}
              disabled={annualUnavailable}
              activeOpacity={0.8}
            >
              {/* Radio */}
              <View
                style={[
                  styles.radioOuter,
                  isAnnualSelected && styles.radioOuterSelected,
                ]}
              >
                {isAnnualSelected && <View style={styles.radioInner} />}
              </View>

              {/* Plan info */}
              <View style={styles.planInfo}>
                <View style={styles.planNameRow}>
                  <Text style={styles.planName}>Annual</Text>
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>BEST VALUE</Text>
                  </View>
                </View>
                <Text style={styles.planTagline}>
                  Best value • Save 79% vs monthly
                </Text>
              </View>

              {/* Price */}
              <View style={styles.planPriceBlock}>
                <Text style={styles.planPrice}>{annualPrice}</Text>
                <Text style={styles.planPricePer}>/year</Text>
              </View>
            </TouchableOpacity>

            {/* CTA button */}
            {isWeb ? (
              <AnimatedPressable
                style={[
                  styles.unlockBtn,
                  !selectedPackage && styles.btnDisabled,
                ]}
                onPress={handleWebMockPurchase}
                disabled={!selectedPackage}
              >
                <Text style={styles.unlockBtnText}>{ctaLabel}</Text>
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                style={[
                  styles.unlockBtn,
                  (purchasing || !selectedPackage) && styles.btnDisabled,
                ]}
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
                    <Text style={styles.devMockBtnText}>
                      Dev: Simulate Purchase
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Restore Purchase */}
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={handleRestore}
              disabled={restoring}
            >
              {restoring ? (
                <ActivityIndicator
                  size="small"
                  color={KIDS_COLORS.textSecondary}
                />
              ) : (
                <Text style={styles.restoreBtnText}>Restore Purchase</Text>
              )}
            </TouchableOpacity>

            {/* Privacy Policy & Terms links */}
            <View style={styles.legalLinksRow}>
              <TouchableOpacity
                onPress={() => {
                  console.log("[Paywall] Privacy Policy link pressed");
                  Linking.openURL(PRIVACY_POLICY_URL);
                }}
              >
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalLinkSep}>·</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log("[Paywall] Terms of Service link pressed");
                  Linking.openURL(TERMS_URL);
                }}
              >
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
            </View>

            {/* Legal */}
            <Text style={styles.legalText}>
              {Platform.OS === "android"
                ? "Payment charged to your Google Play account. Subscriptions auto-renew unless cancelled."
                : Platform.OS === "ios"
                  ? "Payment charged to your Apple ID. Subscriptions auto-renew unless cancelled."
                  : "Payment charged to your account. Subscriptions auto-renew unless cancelled."}
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

  // ── Plan Cards ──
  choosePlanLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 18,
    color: KIDS_COLORS.text,
    marginBottom: 12,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  planCardSelected: {
    borderColor: KIDS_COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${KIDS_COLORS.primary}0D`,
  },
  planCardDisabled: {
    opacity: 0.45,
  },

  // Radio
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: KIDS_COLORS.primary,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: KIDS_COLORS.primary,
  },

  // Plan info
  planInfo: {
    flex: 1,
    gap: 3,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  planName: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 16,
    color: KIDS_COLORS.text,
  },
  planTagline: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: KIDS_COLORS.textSecondary,
    lineHeight: 17,
  },

  // Best value badge
  bestValueBadge: {
    backgroundColor: KIDS_COLORS.accent,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bestValueText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9,
    color: KIDS_COLORS.text,
    letterSpacing: 0.5,
  },

  // Price block
  planPriceBlock: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  planPrice: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 20,
    color: KIDS_COLORS.text,
  },
  planPricePer: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: KIDS_COLORS.textSecondary,
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
    marginTop: 4,
  },
  unlockBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 18,
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
  legalLinksRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  legalLink: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: KIDS_COLORS.primary,
    textDecorationLine: "underline",
  },
  legalLinkSep: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: KIDS_COLORS.textSecondary,
  },
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
