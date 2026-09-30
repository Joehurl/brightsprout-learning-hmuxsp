/**
 * Web stub for react-native-purchases.
 * The real SDK requires native modules that don't exist on web.
 * This stub exports no-op implementations so the module can be imported
 * without crashing on web — all actual SDK usage is guarded by Platform.OS checks.
 */

const noop = () => {};
const noopAsync = async () => {};

const Purchases = {
  configure: noop,
  setLogLevel: noop,
  getOfferings: noopAsync,
  getCustomerInfo: noopAsync,
  purchasePackage: noopAsync,
  restorePurchases: noopAsync,
  /** @returns {{ remove: () => void }} */
  addCustomerInfoUpdateListener: (_listener) => ({ remove: noop }),
};

export default Purchases;

export const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SILENT: 'SILENT',
};

export const PACKAGE_TYPE = {};
export const PRODUCT_CATEGORY = {};
