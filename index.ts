import {
  NativeModules,
  NativeEventEmitter,
  EmitterSubscription,
  Platform,
} from 'react-native'

const { SubscriptionUtils } = NativeModules
const subscriptionUtilsEmitter = new NativeEventEmitter(SubscriptionUtils)

const EVENT_CONNECTION_LOST =
  'com.primlo.subscripiton-utils.android.connection-lost'
const EVENT_PURCHASE_UPDATED =
  'com.primlo.subscripiton-utils.android.purchase-updated'

const getNativeFunction = <T>(functionName: string): T => {
  if (Platform.OS === 'android') {
    return SubscriptionUtils[functionName]
  }

  throw new Error(
    'You called a react-native-subscription-utils-android function on a platform other than Android',
  )
}

const subscribeToEvent = (
  eventName: string,
  callback: any,
): EmitterSubscription => {
  if (Platform.OS === 'android') {
    return subscriptionUtilsEmitter.addListener(eventName, callback)
  }

  throw new Error(
    'You tried to subscribe to a react-native-subscription-utils-android event on a platform other than Android',
  )
}

export enum BillingResponse {
  BILLING_UNAVAILABLE = 'BILLING_UNAVAILABLE',
  DEVELOPER_ERROR = 'DEVELOPER_ERROR',
  ERROR = 'ERROR',
  FEATURE_NOT_SUPPORTED = 'FEATURE_NOT_SUPPORTED',
  ITEM_ALREADY_OWNED = 'ITEM_ALREADY_OWNED',
  ITEM_NOT_OWNED = 'ITEM_NOT_OWNED',
  ITEM_UNAVAILABLE = 'ITEM_UNAVAILABLE',
  OK = 'OK',
  SERVICE_DISCONNECTED = 'SERVICE_DISCONNECTED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  USER_CANCELED = 'USER_CANCELED',
  UNKNOWN_BILLING_RESPONSE = 'UNKNOWN_BILLING_RESPONSE',
}

/**
 * Use this function to connect to the play store. The connection attempt was successful if the promise resolves to BillingResponse.OK. Make sure you subscribe to disconnect events using subscribeToDisconnect before calling this function.
 */
export const connect: () => Promise<BillingResponse> = getNativeFunction(
  'connect',
)

/**
 * Disconnects from the play store. You probably want to call this when you dismiss your subscriptions screen.
 */
export const disconnect: () => Promise<null> = getNativeFunction('disconnect')

/**
 * This function is used to listen to disconnect events.
 * @param callback You might try to reconnect using the connect function in this callback.
 */
export const subscribeToDisconnect = (
  callback: () => void,
): EmitterSubscription => subscribeToEvent(EVENT_CONNECTION_LOST, callback)

/**
 * It's not clear from the docs when this function is supposed to be called.
 */
export const isReady: () => Promise<boolean> = getNativeFunction('isReady')

export type Feature = 'SUBSCRIPTIONS' | 'SUBSCRIPTIONS_UPDATE'

/**
 * It's probably a good idea to call this function to make sure the user's phone supports subscriptions.
 */
export const isFeatureSupported: (
  feature: Feature,
) => Promise<boolean> = getNativeFunction('isFeatureSupported')

export interface SkuDetails {
  description: string
  freeTrialPeriod: string
  introductoryPrice: string
  introductoryPriceAmountMicros: string
  introductoryPriceCycles: string
  introductoryPricePeriod: string
  price: string
  // This is a string rather than a long for serialization reasons
  priceAmountMicros: string
  priceCurrencyCode: string
  sku: string
  subscriptionPeriod: string
  title: string
  type: string
}

/**
 * Use this function to get details for the given SKUs. Getting the SKUs in the first place is your responsibility.
 */
export const querySkuDetails: (
  skus: string[],
) => Promise<SkuDetails[]> = getNativeFunction('querySkuDetails')

export interface LaunchBillingFlowParams {
  sku: string
  oldSku?: string
  accountId?: string
}
/**
 * This launches the sequence of dialogues that are shown to the user to complete a purchase. Make sure you call subscribeToPurchasesUpdated before you call this function.
 */
export const launchBillingFlow: (
  params: LaunchBillingFlowParams,
) => Promise<BillingResponse> = getNativeFunction('launchBillingFlow')

export interface PurchasesData {
  billingResponse: BillingResponse
  purchases: null | Array<{
    orderId: string
    originalJson: string
    packageName: string
    // This is a string rather than a long for serialization reasons
    purchaseTime: string
    purchaseToken: string
    signature: string
    sku: string
    isAutoRenewing: boolean
  }>
}

export const subscribeToPurchasesUpdated = (
  callback: (update: PurchasesData) => void,
): EmitterSubscription => subscribeToEvent(EVENT_PURCHASE_UPDATED, callback)

/**
 * Google recommends calling this on app launch and when returning from background to catch up with subscription status changes that may have happened while the app wasn't active.
 */
export const queryPurchases: () => Promise<PurchasesData> = getNativeFunction(
  'queryPurchases',
)
