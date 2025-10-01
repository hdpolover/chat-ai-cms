'use client';

import { useEffect } from 'react';

/**
 * Component to handle browser extension interference and hydration issues
 */
export default function HydrationFixProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Clean up any unwanted DOM modifications by browser extensions
    const cleanupDOMInterference = () => {
      // Remove any cursor trail wrappers that might interfere
      const cursorTrailElements = document.querySelectorAll('.jso-cursor-trail-wrapper, .jso-cursor-trail-shape');
      cursorTrailElements.forEach(element => {
        element.remove();
      });
      
      // Clean up any style attributes that might cause hydration issues
      const elementsWithStyle = document.querySelectorAll('[style*="position:fixed"]');
      elementsWithStyle.forEach(element => {
        if (element.className?.includes('jso-cursor')) {
          element.remove();
        }
      });
    };

    // Run cleanup after DOM is ready
    const timer = setTimeout(cleanupDOMInterference, 0);
    
    // Set up mutation observer to catch future interference
    const observer = new MutationObserver(() => {
      cleanupDOMInterference();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}