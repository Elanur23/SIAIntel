/**
 * First-Party Data Collection - Client-Side Tracker
 * Privacy-first, GDPR/CCPA compliant tracking
 */

(function() {
  'use strict';

  // Configuration
  const API_ENDPOINT = '/api/data/collect';
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

  // State
  let userId = null;
  let anonymousId = null;
  let sessionId = null;
  let sessionStartTime = null;
  let lastActivityTime = null;
  let pageStartTime = null;
  let maxScrollDepth = 0;
  let heartbeatInterval = null;
  let consentGiven = false;

  /**
   * Initialize tracker
   */
  function init() {
    // Check consent
    const consent = localStorage.getItem('cookie_consent');
    if (consent) {
      const prefs = JSON.parse(consent);
      consentGiven = prefs.analytics || prefs.personalization;
    }

    if (!consentGiven) {
      console.log('[Data Tracker] Waiting for consent...');
      return;
    }

    // Get or create IDs
    anonymousId = getOrCreateAnonymousId();
    userId = getUserId();
    sessionId = getOrCreateSessionId();

    // Initialize session
    sessionStartTime = Date.now();
    lastActivityTime = Date.now();
    pageStartTime = Date.now();

    // Track page view
    trackPageView();

    // Setup event listeners
    setupEventListeners();

    // Start heartbeat
    startHeartbeat();

    console.log('[Data Tracker] Initialized', { anonymousId, userId, sessionId });
  }

  /**
   * Get or create anonymous ID
   */
  function getOrCreateAnonymousId() {
    let id = localStorage.getItem('anonymous_id');
    if (!id) {
      id = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('anonymous_id', id);
    }
    return id;
  }

  /**
   * Get user ID (if logged in)
   */
  function getUserId() {
    // Check if user is logged in
    const userIdMeta = document.querySelector('meta[name="user-id"]');
    return userIdMeta ? userIdMeta.content : null;
  }

  /**
   * Get or create session ID
   */
  function getOrCreateSessionId() {
    const stored = sessionStorage.getItem('session_id');
    const storedTime = sessionStorage.getItem('session_time');

    // Check if session is still valid
    if (stored && storedTime && Date.now() - parseInt(storedTime) < SESSION_TIMEOUT) {
      return stored;
    }

    // Create new session
    const id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem('session_id', id);
    sessionStorage.setItem('session_time', Date.now().toString());
    return id;
  }

  /**
   * Track event
   */
  async function trackEvent(eventType, eventData = {}) {
    if (!consentGiven) return;

    try {
      const event = {
        userId: userId || anonymousId,
        anonymousId,
        sessionId,
        eventType,
        eventData: {
          ...eventData,
          device: getDeviceInfo(),
          language: navigator.language,
          referrer: document.referrer,
          userAgent: navigator.userAgent
        },
        pageUrl: window.location.href
      };

      await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      console.log('[Data Tracker] Event tracked:', eventType);
    } catch (error) {
      console.error('[Data Tracker] Error tracking event:', error);
    }
  }

  /**
   * Get device info
   */
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let type = 'desktop';
    
    if (/mobile/i.test(ua)) type = 'mobile';
    else if (/tablet|ipad/i.test(ua)) type = 'tablet';

    return {
      type,
      os: getOS(),
      browser: getBrowser(),
      screenResolution: `${window.screen.width}x${window.screen.height}`
    };
  }

  /**
   * Get OS
   */
  function getOS() {
    const ua = navigator.userAgent;
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    if (/android/i.test(ua)) return 'Android';
    if (/ios|iphone|ipad/i.test(ua)) return 'iOS';
    return 'Unknown';
  }

  /**
   * Get browser
   */
  function getBrowser() {
    const ua = navigator.userAgent;
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/edge/i.test(ua)) return 'Edge';
    return 'Unknown';
  }

  /**
   * Track page view
   */
  function trackPageView() {
    const category = getPageCategory();
    trackEvent('page_view', {
      title: document.title,
      category,
      path: window.location.pathname
    });
  }

  /**
   * Get page category
   */
  function getPageCategory() {
    const path = window.location.pathname;
    if (path.includes('/news/')) return 'news';
    if (path.includes('/technology')) return 'technology';
    if (path.includes('/business')) return 'business';
    if (path.includes('/sports')) return 'sports';
    if (path.includes('/entertainment')) return 'entertainment';
    return 'general';
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', function() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function() {
        const scrollDepth = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;
          
          // Track milestone scrolls
          if (scrollDepth >= 25 && scrollDepth < 50 && maxScrollDepth < 50) {
            trackEvent('scroll', { depth: 25 });
          } else if (scrollDepth >= 50 && scrollDepth < 75 && maxScrollDepth < 75) {
            trackEvent('scroll', { depth: 50 });
          } else if (scrollDepth >= 75 && scrollDepth < 90 && maxScrollDepth < 90) {
            trackEvent('scroll', { depth: 75 });
          } else if (scrollDepth >= 90 && maxScrollDepth < 100) {
            trackEvent('scroll', { depth: 90 });
          }
        }
      }, 500);
    });

    // Click tracking
    document.addEventListener('click', function(e) {
      lastActivityTime = Date.now();

      // Track link clicks
      const link = e.target.closest('a');
      if (link) {
        trackEvent('click', {
          element: 'link',
          href: link.href,
          text: link.textContent.substring(0, 100)
        });
      }

      // Track button clicks
      const button = e.target.closest('button');
      if (button) {
        trackEvent('click', {
          element: 'button',
          text: button.textContent.substring(0, 100)
        });
      }
    });

    // Search tracking
    const searchForms = document.querySelectorAll('form[role="search"], form.search-form');
    searchForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        const input = form.querySelector('input[type="search"], input[name="q"], input[name="query"]');
        if (input) {
          trackEvent('search', {
            query: input.value
          });
        }
      });
    });

    // Newsletter subscription tracking
    const newsletterForms = document.querySelectorAll('form.newsletter-form, form[data-newsletter]');
    newsletterForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        trackEvent('newsletter_subscribe', {});
      });
    });

    // Before unload - track time spent
    window.addEventListener('beforeunload', function() {
      const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
      trackEvent('time_spent', {
        duration: timeSpent,
        scrollDepth: maxScrollDepth
      });
    });

    // Visibility change
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
        trackEvent('time_spent', {
          duration: timeSpent,
          scrollDepth: maxScrollDepth
        });
      } else {
        pageStartTime = Date.now();
        maxScrollDepth = 0;
      }
    });
  }

  /**
   * Start heartbeat
   */
  function startHeartbeat() {
    heartbeatInterval = setInterval(function() {
      // Check if session is still active
      if (Date.now() - lastActivityTime > SESSION_TIMEOUT) {
        stopHeartbeat();
        return;
      }

      // Update session time
      sessionStorage.setItem('session_time', Date.now().toString());

      // Track engagement
      const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
      if (timeSpent > 0) {
        trackEvent('engagement', {
          duration: timeSpent,
          scrollDepth: maxScrollDepth
        });
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  /**
   * Public API
   */
  window.DataTracker = {
    track: trackEvent,
    identify: function(newUserId) {
      userId = newUserId;
      trackEvent('identify', { userId: newUserId });
    },
    reset: function() {
      localStorage.removeItem('anonymous_id');
      sessionStorage.removeItem('session_id');
      sessionStorage.removeItem('session_time');
      userId = null;
      anonymousId = null;
      sessionId = null;
    }
  };

  // Initialize when consent is given
  window.initAnalytics = init;
  window.initPersonalization = init;

  // Auto-initialize if consent already given
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
