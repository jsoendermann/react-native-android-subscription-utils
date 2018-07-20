package com.primlo.subscriptionutils;

import java.util.List;
import java.util.ArrayList;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import android.util.Log;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClient.BillingResponse;
import com.android.billingclient.api.BillingClient.FeatureType;
import com.android.billingclient.api.BillingClient.SkuType;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.ConsumeResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.Purchase.PurchasesResult;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.SkuDetails;
import com.android.billingclient.api.SkuDetailsParams;
import com.android.billingclient.api.SkuDetailsResponseListener;

public class SubscriptionUtilsModule extends ReactContextBaseJavaModule implements PurchasesUpdatedListener {
  private static final String TAG = "SubscriptionUtils";
  private static final String ERR_CONNECTION_ERROR = "ERR_CONNECTION_ERROR";
  private static final String ERR_COULD_NOT_LOAD_PRODUCTS = "ERR_COULD_NOT_LOAD_PRODUCTS";
  private static final String EVENT_CONNECTION_LOST = "com.primlo.subscripiton-utils.android.connection-lost";

  private BillingClient mBillingClient;

  public SubscriptionUtilsModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "SubscriptionUtils";
  }

  private void sendEvent(String eventName, WritableMap params) {
    getReactApplicationContext().getJSModule(RCTNativeAppEventEmitter.class).emit(eventName, params);
  }

  @ReactMethod
  public void connect(final Promise promise) {
    this.mBillingClient = BillingClient.newBuilder(getCurrentActivity()).setListener(this).build();
    this.mBillingClient.startConnection(new BillingClientStateListener() {
      @Override
      public void onBillingSetupFinished(@BillingResponse int billingResponseCode) {
        if (billingResponseCode == BillingResponse.OK) {
          promise.resolve(null);
        } else {
          promise.reject(ERR_CONNECTION_ERROR, Integer.toString(billingResponseCode));
        }
      }

      @Override
      public void onBillingServiceDisconnected() {
        sendEvent(EVENT_CONNECTION_LOST, null);
      }
    });
  }

  @ReactMethod
  public void loadProducts(ReadableArray jsSkuList, final Promise promise) {
    List skuList = new ArrayList<>();
    for (int i = 0; i < jsSkuList.size(); i++) {
      skuList.add(jsSkuList.getString(i));
    }
    SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder();
    params.setSkusList(skuList).setType(SkuType.SUBS);
    mBillingClient.querySkuDetailsAsync(params.build(), new SkuDetailsResponseListener() {
      @Override
      public void onSkuDetailsResponse(int responseCode, List<SkuDetails> skuDetailsList) {
        if (responseCode == BillingResponse.OK) {
          WritableArray skuDetails = Arguments.createArray();
          for (SkuDetails d : skuDetailsList) {
            WritableMap map = Arguments.createMap();
            map.putString("description", d.getDescription());
            map.putString("freeTrialPeriod", d.getFreeTrialPeriod());
            map.putString("introductoryPrice", d.getIntroductoryPrice());
            map.putString("introductoryPriceAmountMicros", d.getIntroductoryPriceAmountMicros());
            map.putString("introductoryPriceCycles", d.getIntroductoryPriceCycles());
            map.putString("introductoryPricePeriod", d.getIntroductoryPricePeriod());
            map.putString("price", d.getPrice());
            map.putString("priceAmountMicros", Long.toString(d.getPriceAmountMicros()));
            map.putString("priceCurrencyCode", d.getPriceCurrencyCode());
            map.putString("sku", d.getSku());
            map.putString("subscriptionPeriod", d.getSubscriptionPeriod());
            map.putString("title", d.getTitle());
            map.putString("type", d.getType());
            skuDetails.pushMap(map);
          }
          promise.resolve(skuDetails);
        } else {
          promise.reject(ERR_COULD_NOT_LOAD_PRODUCTS, Integer.toString(responseCode));
        }
      }
    });
  }

  @ReactMethod
  public void launchBillingFlow(final String skuId) {
    Runnable purchaseFlowRequest = new Runnable() {
      @Override
      public void run() {
        Log.d(TAG, "Launching billing flow.");

        BillingFlowParams flowParams = BillingFlowParams.newBuilder().setSku(skuId).setType(SkuType.SUBS).build();
        int responseCode = mBillingClient.launchBillingFlow(getCurrentActivity(), flowParams);
        Log.d(TAG, "Billing flow response code: " + Integer.toString(responseCode));
      }
    };

    purchaseFlowRequest.run();
  }

  @Override
  public void onPurchasesUpdated(@BillingResponse int responseCode, List purchases) {
    Log.d(TAG, "onPurchasesUpdated response code: " + Integer.toString(responseCode));
    // if (responseCode == BillingResponse.OK && purchases != null) {
    // for (Purchase purchase : purchases) {
    // handlePurchase(purchase);
    // }
    // } else if (responseCode == BillingResponse.USER_CANCELED) {
    // // Handle an error caused by a user cancelling the purchase flow.
    // } else {
    // // Handle any other error codes.
    // }
  }

}