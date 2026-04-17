/**
 * Dynamic Affiliate Injection - Client-Side Tracking Script
 * Tracks impressions, clicks, and conversions for affiliate links
 */

(function() {
  'use strict';

  // Configuration
  const TRACKING_API = '/api/affiliate/track';
  const IMPRESSION_THRESHOLD = 0.5; // 50% visibility
  const IMPRESSION_DURATION = 1000; // 1 second

  // Track which injections have been seen
  const seenInjections = new Set();
  const clickedInjections = new Set();

  /**
   * Send tracking event to API
   */
  async function trackEvent(articleId, injectionId, event, revenue = null) {
    try {
      const payload = {
        articleId,
        injectionId,
        event
      };

      if (revenue !== null) {
        payload.revenue = revenue;
      }

      await fetch(TRACKING_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`[Affiliate Tracking] ${event}:`, injectionId);
    } catch (error) {
      console.error('[Affiliate Tracking] Error:', error);
    }
  }

  /**
   * Track impression when element is visible
   */
  function trackImpression(element, articleId, injectionId) {
    if (seenInjections.has(injectionId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= IMPRESSION_THRESHOLD) {
            // Wait for impression duration before tracking
            setTimeout(() => {
              if (entry.isIntersecting && !seenInjections.has(injectionId)) {
                seenInjections.add(injectionId);
                trackEvent(articleId, injectionId, 'impression');
                observer.disconnect();
              }
            }, IMPRESSION_DURATION);
          }
        });
      },
      {
        threshold: IMPRESSION_THRESHOLD
      }
    );

    observer.observe(element);
  }

  /**
   * Track click on affiliate link
   */
  function trackClick(element, articleId, injectionId) {
    element.addEventListener('click', (e) => {
      if (!clickedInjections.has(injectionId)) {
        clickedInjections.add(injectionId);
        trackEvent(articleId, injectionId, 'click');
      }

      // Store click data in localStorage for conversion tracking
      const clickData = {
        articleId,
        injectionId,
        timestamp: Date.now(),
        productId: element.dataset.product
      };

      const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
      clicks.push(clickData);
      
      // Keep only last 30 days of clicks
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentClicks = clicks.filter(c => c.timestamp > thirtyDaysAgo);
      
      localStorage.setItem('affiliate_clicks', JSON.stringify(recentClicks));
    });
  }

  /**
   * Track conversion (called from thank you page or conversion pixel)
   */
  window.trackAffiliateConversion = function(productId, orderValue) {
    const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
    
    // Find the most recent click for this product
    const recentClick = clicks
      .filter(c => c.productId === productId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (recentClick) {
      trackEvent(
        recentClick.articleId,
        recentClick.injectionId,
        'conversion',
        orderValue
      );

      // Remove the click from storage
      const updatedClicks = clicks.filter(c => c !== recentClick);
      localStorage.setItem('affiliate_clicks', JSON.stringify(updatedClicks));

      console.log('[Affiliate Tracking] Conversion tracked:', productId, orderValue);
    }
  };

  /**
   * Initialize tracking for all affiliate elements
   */
  function initializeTracking() {
    // Get article ID from meta tag or URL
    const articleMeta = document.querySelector('meta[name="article:id"]');
    const articleId = articleMeta ? articleMeta.content : window.location.pathname.split('/').pop();

    // Track affiliate cards
    document.querySelectorAll('.affiliate-card').forEach((card) => {
      const injectionId = card.dataset.injection || `card_${Math.random().toString(36).substr(2, 9)}`;
      const productId = card.dataset.product;

      if (productId) {
        trackImpression(card, articleId, injectionId);

        // Track clicks on buttons within the card
        const button = card.querySelector('.affiliate-card-button');
        if (button) {
          trackClick(button, articleId, injectionId);
        }
      }
    });

    // Track inline affiliate links
    document.querySelectorAll('.affiliate-link.inline').forEach((link) => {
      const injectionId = link.dataset.injection || `link_${Math.random().toString(36).substr(2, 9)}`;
      const productId = link.dataset.product;

      if (productId) {
        trackImpression(link, articleId, injectionId);
        trackClick(link, articleId, injectionId);
      }
    });

    // Track sidebar widgets
    document.querySelectorAll('.affiliate-sidebar').forEach((sidebar) => {
      const injectionId = sidebar.dataset.injection || `sidebar_${Math.random().toString(36).substr(2, 9)}`;
      const productId = sidebar.dataset.product;

      if (productId) {
        trackImpression(sidebar, articleId, injectionId);

        const button = sidebar.querySelector('.affiliate-sidebar-button');
        if (button) {
          trackClick(button, articleId, injectionId);
        }
      }
    });

    // Track banners
    document.querySelectorAll('.affiliate-banner').forEach((banner) => {
      const injectionId = banner.dataset.injection || `banner_${Math.random().toString(36).substr(2, 9)}`;
      const productId = banner.dataset.product;

      if (productId) {
        trackImpression(banner, articleId, injectionId);

        const button = banner.querySelector('.affiliate-banner-button');
        if (button) {
          trackClick(button, articleId, injectionId);
        }
      }
    });

    console.log('[Affiliate Tracking] Initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
  } else {
    initializeTracking();
  }

  // Re-initialize on dynamic content changes (for SPAs)
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          initializeTracking();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
