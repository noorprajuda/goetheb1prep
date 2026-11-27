import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  trackEvent, 
  trackPageView, 
  trackUserAction, 
  trackTestEvent, 
  trackError, 
  trackPerformance,
  setUserProperties,
  trackSubscription,
  GA_EVENTS 
} from '@/lib/analytics';

export function useAnalytics() {
  const router = useRouter();

  // Track page views
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      trackPageView(url);
    };

    // Track initial page load
    if (typeof window !== 'undefined') {
      trackPageView(window.location.href);
    }

    // Note: In App Router, we need to track page changes differently
    // This is a simplified version - in production, use a proper router event listener
  }, []);

  return {
    // Event tracking functions
    trackEvent,
    trackUserAction,
    trackTestEvent,
    trackError,
    trackPerformance,
    setUserProperties,
    trackSubscription,
    
    // Specific event helpers
    trackPageView: (url: string, title?: string) => trackPageView(url, title),
    trackUserLogin: (userId: string) => {
      trackEvent(GA_EVENTS.USER_LOGIN, { user_id: userId });
      setUserProperties({ user_id: userId, user_type: 'registered' });
    },
    trackUserRegister: (userId: string) => {
      trackEvent(GA_EVENTS.USER_REGISTER, { user_id: userId });
      setUserProperties({ user_id: userId, user_type: 'new_user' });
    },
    trackUserLogout: () => {
      trackEvent(GA_EVENTS.USER_LOGOUT);
      setUserProperties({ user_id: null, user_type: 'guest' });
    },
    trackTestStart: (testType: string) => {
      trackTestEvent(testType, GA_EVENTS.TEST_START);
    },
    trackTestComplete: (testType: string, duration: number) => {
      trackTestEvent(testType, GA_EVENTS.TEST_COMPLETE, duration);
    },
    trackSprechenTestStart: () => {
      trackEvent(GA_EVENTS.SPRECHEN_TEST_START);
    },
    trackSprechenTestStop: (duration: number) => {
      trackEvent(GA_EVENTS.SPRECHEN_TEST_STOP, { duration });
    },
    trackTeil1Start: () => {
      trackEvent(GA_EVENTS.TEIL1_START);
    },
    trackTeil1Complete: (duration: number) => {
      trackEvent(GA_EVENTS.TEIL1_COMPLETE, { duration });
    },
    trackTeil3Start: () => {
      trackEvent(GA_EVENTS.TEIL3_START);
    },
    trackTeil3Complete: (duration: number) => {
      trackEvent(GA_EVENTS.TEIL3_COMPLETE, { duration });
    },
    trackSubscriptionView: (planId: string) => {
      trackEvent(GA_EVENTS.SUBSCRIPTION_VIEW, { plan_id: planId });
    },
    trackSubscriptionStart: (planId: string, planName: string, value: number) => {
      trackEvent(GA_EVENTS.SUBSCRIPTION_START, { 
        plan_id: planId, 
        plan_name: planName, 
        value 
      });
    },
    trackSubscriptionSuccess: (planId: string, planName: string, value: number) => {
      trackSubscription(planId, planName, value);
    },
    trackSubscriptionCancel: (planId: string) => {
      trackEvent(GA_EVENTS.SUBSCRIPTION_CANCEL, { plan_id: planId });
    },
    trackContentDownload: (contentType: string, contentId: string) => {
      trackEvent(GA_EVENTS.CONTENT_DOWNLOAD, { 
        content_type: contentType, 
        content_id: contentId 
      });
    },
    trackContentShare: (contentType: string, contentId: string, platform: string) => {
      trackEvent(GA_EVENTS.CONTENT_SHARE, { 
        content_type: contentType, 
        content_id: contentId, 
        platform 
      });
    },
    trackApiError: (endpoint: string, statusCode: number, errorMessage: string) => {
      trackEvent(GA_EVENTS.API_ERROR, {
        endpoint,
        status_code: statusCode,
        error_message: errorMessage,
      });
    },
    trackPageLoadTime: (loadTime: number, page: string) => {
      trackPerformance('page_load_time', loadTime);
      trackEvent(GA_EVENTS.PAGE_LOAD_TIME, {
        page,
        load_time: loadTime,
      });
    },
    trackApiResponseTime: (endpoint: string, responseTime: number) => {
      trackPerformance('api_response_time', responseTime);
      trackEvent(GA_EVENTS.API_RESPONSE_TIME, {
        endpoint,
        response_time: responseTime,
      });
    },
  };
}

// Hook for tracking test performance
export function useTestAnalytics() {
  const analytics = useAnalytics();

  const startTest = (testType: string) => {
    analytics.trackTestStart(testType);
  };

  const completeTest = (testType: string, duration: number) => {
    analytics.trackTestComplete(testType, duration);
  };

  const abandonTest = (testType: string, duration: number) => {
    analytics.trackEvent(GA_EVENTS.TEST_ABANDON, {
      test_type: testType,
      duration,
    });
  };

  return {
    startTest,
    completeTest,
    abandonTest,
  };
}

// Hook for tracking subscription events
export function useSubscriptionAnalytics() {
  const analytics = useAnalytics();

  const viewSubscription = (planId: string) => {
    analytics.trackSubscriptionView(planId);
  };

  const startSubscription = (planId: string, planName: string, value: number) => {
    analytics.trackSubscriptionStart(planId, planName, value);
  };

  const completeSubscription = (planId: string, planName: string, value: number) => {
    analytics.trackSubscriptionSuccess(planId, planName, value);
  };

  const cancelSubscription = (planId: string) => {
    analytics.trackSubscriptionCancel(planId);
  };

  return {
    viewSubscription,
    startSubscription,
    completeSubscription,
    cancelSubscription,
  };
}

// Hook for tracking performance metrics
export function usePerformanceAnalytics() {
  const analytics = useAnalytics();

  const trackPagePerformance = (page: string) => {
    if (typeof window !== 'undefined') {
      const loadTime = performance.now();
      analytics.trackPageLoadTime(loadTime, page);
    }
  };

  const trackApiPerformance = (endpoint: string, startTime: number) => {
    const responseTime = performance.now() - startTime;
    analytics.trackApiResponseTime(endpoint, responseTime);
  };

  return {
    trackPagePerformance,
    trackApiPerformance,
  };
}
