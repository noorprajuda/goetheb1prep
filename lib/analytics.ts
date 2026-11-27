// Google Analytics 4 Configuration and Tracking
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';

// Google Analytics 4 Events
export const GA_EVENTS = {
  // Page Views
  PAGE_VIEW: 'page_view',
  
  // User Actions
  USER_REGISTER: 'user_register',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Test Actions
  TEST_START: 'test_start',
  TEST_COMPLETE: 'test_complete',
  TEST_ABANDON: 'test_abandon',
  
  // Speaking Test Events
  SPRECHEN_TEST_START: 'sprechen_test_start',
  SPRECHEN_TEST_PAUSE: 'sprechen_test_pause',
  SPRECHEN_TEST_RESUME: 'sprechen_test_resume',
  SPRECHEN_TEST_STOP: 'sprechen_test_stop',
  
  // Teil Specific Events
  TEIL1_START: 'teil1_start',
  TEIL1_COMPLETE: 'teil1_complete',
  TEIL3_START: 'teil3_start',
  TEIL3_COMPLETE: 'teil3_complete',
  
  // Subscription Events
  SUBSCRIPTION_VIEW: 'subscription_view',
  SUBSCRIPTION_START: 'subscription_start',
  SUBSCRIPTION_SUCCESS: 'subscription_success',
  SUBSCRIPTION_CANCEL: 'subscription_cancel',
  
  // Content Engagement
  CONTENT_VIEW: 'content_view',
  CONTENT_DOWNLOAD: 'content_download',
  CONTENT_SHARE: 'content_share',
  
  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  
  // Performance Events
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
} as const;

// Custom Dimensions
export const GA_DIMENSIONS = {
  USER_ID: 'user_id',
  USER_TYPE: 'user_type',
  TEST_TYPE: 'test_type',
  SUBSCRIPTION_STATUS: 'subscription_status',
  ERROR_TYPE: 'error_type',
  PAGE_SECTION: 'page_section',
} as const;

// Custom Metrics
export const GA_METRICS = {
  TEST_DURATION: 'test_duration',
  AUDIO_DURATION: 'audio_duration',
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
} as const;

// Google Analytics 4 Event Interface
export interface GAEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, unknown>;
}

// Google Analytics 4 Configuration
export const GA_CONFIG = {
  measurement_id: GA_TRACKING_ID,
  config: {
    send_page_view: true,
    anonymize_ip: true,
    allow_google_signals: true,
    allow_ad_personalization_signals: false,
    cookie_flags: 'SameSite=None;Secure',
  },
  custom_map: {
    [GA_DIMENSIONS.USER_ID]: 'user_id',
    [GA_DIMENSIONS.USER_TYPE]: 'user_type',
    [GA_DIMENSIONS.TEST_TYPE]: 'test_type',
    [GA_DIMENSIONS.SUBSCRIPTION_STATUS]: 'subscription_status',
    [GA_DIMENSIONS.ERROR_TYPE]: 'error_type',
    [GA_DIMENSIONS.PAGE_SECTION]: 'page_section',
  },
};

// Event Tracking Functions
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: title,
      page_location: url,
    });
  }
};

export const trackUserAction = (action: string, category: string, label?: string, value?: number) => {
  trackEvent(action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export const trackTestEvent = (testType: string, action: string, duration?: number) => {
  trackEvent(action, {
    test_type: testType,
    test_duration: duration,
    timestamp: Date.now(),
  });
};

export const trackError = (errorType: string, errorMessage: string, errorCode?: string) => {
  trackEvent(GA_EVENTS.ERROR_OCCURRED, {
    error_type: errorType,
    error_message: errorMessage,
    error_code: errorCode,
    timestamp: Date.now(),
  });
};

export const trackPerformance = (metric: string, value: number, unit: string = 'ms') => {
  trackEvent(GA_EVENTS.PAGE_LOAD_TIME, {
    metric_name: metric,
    metric_value: value,
    metric_unit: unit,
    timestamp: Date.now(),
  });
};

// User Properties
export const setUserProperties = (properties: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      user_properties: properties,
    });
  }
};

// E-commerce Tracking
export const trackPurchase = (transactionId: string, value: number, currency: string = 'EUR', items?: unknown[]) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items,
  });
};

// Enhanced E-commerce for Subscription
export const trackSubscription = (planId: string, planName: string, value: number, currency: string = 'EUR') => {
  trackEvent(GA_EVENTS.SUBSCRIPTION_SUCCESS, {
    item_id: planId,
    item_name: planName,
    value: value,
    currency: currency,
    item_category: 'subscription',
  });
};

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}
