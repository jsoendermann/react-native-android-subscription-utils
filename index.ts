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

export const connect: () => Promise<null> = getNativeFunction('connect')

export const disconnect: () => Promise<null> = getNativeFunction('disconnect')

export const subscribeToDisconnect = (
  callback: () => void,
): EmitterSubscription => subscribeToEvent(EVENT_CONNECTION_LOST, callback)

export const isReady: () => Promise<boolean> = getNativeFunction('isReady')

export type Feature = 'SUBSCRIPTIONS' | 'SUBSCRIPTIONS_UPDATE'

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

export const querySkuDetails: (
  skus: string[],
) => Promise<SkuDetails[]> = getNativeFunction('querySkuDetails')

export interface LaunchBillingFlowParams {
  sku: string
  oldSku?: string
  accountId?: string
}
export const launchBillingFlow: (
  params: LaunchBillingFlowParams,
) => Promise<void> = getNativeFunction('launchBillingFlow')

export type BillingResponse =
  | 'BILLING_UNAVAILABLE'
  | 'DEVELOPER_ERROR'
  | 'ERROR'
  | 'FEATURE_NOT_SUPPORTED'
  | 'ITEM_ALREADY_OWNED'
  | 'ITEM_NOT_OWNED'
  | 'ITEM_UNAVAILABLE'
  | 'OK'
  | 'SERVICE_DISCONNECTED'
  | 'SERVICE_UNAVAILABLE'
  | 'USER_CANCELED'
  | 'UNKNOWN_BILLING_RESPONSE'

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
 * Call queryPurchases() at least twice in your code:

    Every time your app launches so that you can restore any purchases that a user has made since the app last stopped.
    In your onResume() method because a user can make a purchase when your app is in the background (for example, redeeming a promo code in Play Store app).

 */
export const queryPurchases: () => Promise<PurchasesData> = getNativeFunction(
  'queryPurchases',
)
