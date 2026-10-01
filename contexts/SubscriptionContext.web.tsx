/**
 * Web-safe SubscriptionContext — no react-native-purchases import.
 * Metro automatically picks this file on web (platform extension resolution).
 * The native version (SubscriptionContext.tsx) is used on iOS/Android.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Constants from "expo-constants";

// Minimal type stubs so the interface matches the native version without importing RC
type PurchasesPackage = {
  identifier: string;
  product: {
    title: string;
    priceString: string;
    description: string;
    price?: number;
    currencyCode?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
type PurchasesOfferings = null;
type PurchasesOffering = null;

const _PROJECT_SCOPE =
  Constants.expoConfig?.extra?.nativelyProjectId ||
  Constants.expoConfig?.slug ||
  "app";
const MOCK_PURCHASE_KEY = `rc_mock_purchased_${_PROJECT_SCOPE}`;

interface SubscriptionContextType {
  isSubscribed: boolean;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOffering | null;
  packages: PurchasesPackage[];
  loading: boolean;
  isWeb: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
  mockWebPurchase: () => void;
  mockNativePurchase: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore mock purchase state from localStorage
    try {
      if (
        typeof window !== "undefined" &&
        localStorage.getItem(MOCK_PURCHASE_KEY) === "true"
      ) {
        setIsSubscribed(true);
      }
    } catch {
      // localStorage may be unavailable in some environments
    }

    // Provide mock packages for web preview
    const mockPackages: PurchasesPackage[] = [
      {
        identifier: "$rc_monthly",
        product: {
          title: "Monthly",
          priceString: "$1.99",
          description: "Monthly subscription",
        },
      },
      {
        identifier: "$rc_annual",
        product: {
          title: "Annual",
          priceString: "$4.99",
          description: "Annual subscription",
        },
      },
    ];
    setPackages(mockPackages);
    console.log("[revenuecat] Web preview: showing mock prices");
    setLoading(false);
  }, []);

  const purchasePackage = async (_pkg: PurchasesPackage): Promise<boolean> => {
    console.warn("[RevenueCat] Purchases not available on web");
    return false;
  };

  const restorePurchases = async (): Promise<boolean> => {
    console.warn("[RevenueCat] Restore not available on web");
    return false;
  };

  const checkSubscription = async (): Promise<void> => {
    // no-op on web
  };

  const mockWebPurchase = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(MOCK_PURCHASE_KEY, "true");
      }
    } catch {
      // ignore
    }
    setIsSubscribed(true);
  };

  const mockNativePurchase = async (): Promise<void> => {
    // no-op on web
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        offerings: null,
        currentOffering: null,
        packages,
        loading,
        isWeb: true,
        purchasePackage,
        restorePurchases,
        checkSubscription,
        mockWebPurchase,
        mockNativePurchase,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within SubscriptionProvider"
    );
  }
  return context;
}
