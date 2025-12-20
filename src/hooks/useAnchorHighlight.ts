import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook that highlights anchor targets when navigating to them
 * and handles smooth scrolling with visual feedback
 */
export function useAnchorHighlight() {
  const location = useLocation();

  // Highlight animation for the target element
  const highlightElement = useCallback((element: Element) => {
    // Add highlight class
    element.classList.add("anchor-highlight");
    
    // Remove highlight after animation completes
    setTimeout(() => {
      element.classList.remove("anchor-highlight");
    }, 2000);
  }, []);

  // Find element by ID or by heading text content
  const findElement = useCallback((id: string): Element | null => {
    // First, try direct ID lookup
    let element = document.getElementById(id) || document.querySelector(`[id="${id}"]`);
    
    if (element) return element;
    
    // If not found, try to find by heading text content with multiple strategies
    const searchText = id.replace(/-/g, ' ').toLowerCase().trim();
    const searchWords = searchText.split(' ').filter(w => w.length > 2);
    const headings = document.querySelectorAll('h2, h3, h4, h5, h6, [class*="heading"], strong');
    
    // Strategy 1: Exact match
    for (const heading of headings) {
      const headingText = heading.textContent?.toLowerCase().trim() || '';
      if (headingText === searchText) {
        return heading;
      }
    }
    
    // Strategy 2: Contains match
    for (const heading of headings) {
      const headingText = heading.textContent?.toLowerCase().trim() || '';
      if (headingText.includes(searchText) || searchText.includes(headingText)) {
        return heading;
      }
    }
    
    // Strategy 3: Word-based match (for "user conduct" matching "User Conduct Guidelines")
    for (const heading of headings) {
      const headingText = heading.textContent?.toLowerCase().trim() || '';
      const matchCount = searchWords.filter(word => headingText.includes(word)).length;
      if (matchCount >= searchWords.length) {
        return heading;
      }
    }
    
    // Strategy 4: Check prose content for matching section headers
    const proseElements = document.querySelectorAll('.prose h2, .prose h3, .prose h4, .prose strong');
    for (const el of proseElements) {
      const text = el.textContent?.toLowerCase().trim() || '';
      if (text.includes(searchText) || searchWords.every(word => text.includes(word))) {
        return el;
      }
    }
    
    return null;
  }, []);

  // Handle anchor click with smooth scroll and highlight
  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    
    const element = findElement(id);
    
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
      
      // Small delay to let scroll complete before highlighting
      setTimeout(() => {
        highlightElement(element);
      }, 500);
    }
  }, [findElement, highlightElement]);

  // Handle initial hash on page load
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      
      // Wait for content to load
      setTimeout(() => {
        const element = findElement(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            highlightElement(element);
          }, 500);
        }
      }, 300);
    }
  }, [location.hash, findElement, highlightElement]);

  return { handleAnchorClick, findElement, highlightElement };
}
