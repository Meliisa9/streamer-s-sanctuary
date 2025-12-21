import DOMPurify from 'dompurify';

// Configure DOMPurify hooks for additional security
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Ensure all links open safely
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    // Force external links to open in new tab
    const href = node.getAttribute('href');
    if (href && !href.startsWith('/') && !href.startsWith('#')) {
      node.setAttribute('target', '_blank');
    }
  }
  
  // Ensure iframes only load from trusted sources
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') || '';
    const trustedDomains = [
      'youtube.com', 'www.youtube.com', 'youtube-nocookie.com',
      'player.twitch.tv', 'twitch.tv',
      'player.kick.com', 'kick.com',
      'vimeo.com', 'player.vimeo.com'
    ];
    
    try {
      const url = new URL(src);
      const isTrusted = trustedDomains.some(domain => url.hostname.endsWith(domain));
      if (!isTrusted) {
        node.setAttribute('src', 'about:blank');
        node.setAttribute('data-blocked', 'untrusted-source');
      }
    } catch {
      // Invalid URL, block it
      node.setAttribute('src', 'about:blank');
    }
    
    // Add sandbox attribute for security
    node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
  }
});

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Allows safe HTML elements commonly used in content management.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'video', 'iframe', 'source',
      'strong', 'b', 'em', 'i', 'u', 's',
      'a', 'ul', 'ol', 'li', 'blockquote', 'br', 'hr',
      'div', 'span', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'controls', 'autoplay', 'muted', 'loop', 'playsinline',
      'type', 'width', 'height', 'target', 'rel',
      'allow', 'allowfullscreen', 'frameborder', 'sandbox'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
};

/**
 * Strict sanitization for user-generated content (no iframes/media)
 */
export const sanitizeUserContent = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'a', 'ul', 'ol', 'li', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Process and sanitize news article content.
 * Handles both HTML content and plain text content.
 */
export const processAndSanitizeContent = (content: string, contentHtml: string | null): string => {
  let processed = '';

  if (contentHtml && contentHtml.trim()) {
    const hasHtmlTags = /<[^>]+>/.test(contentHtml);
    if (hasHtmlTags) {
      processed = contentHtml;
      const parts = processed.split(/\n\n+/);
      processed = parts.map(part => {
        const trimmed = part.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<div') || trimmed.startsWith('<p') || 
            trimmed.startsWith('<h1') || trimmed.startsWith('<h2') || 
            trimmed.startsWith('<h3') || trimmed.startsWith('<img') ||
            trimmed.startsWith('<video') || trimmed.startsWith('<iframe') ||
            trimmed.startsWith('<ul') || trimmed.startsWith('<ol') ||
            trimmed.startsWith('<blockquote')) {
          return trimmed;
        }
        return `<p class="mb-4 text-muted-foreground leading-relaxed">${trimmed}</p>`;
      }).join('\n');
    }
  }
  
  if (!processed && content && content.trim()) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    processed = paragraphs.map(p => 
      `<p class="mb-4 text-muted-foreground leading-relaxed">${p.trim().replace(/\n/g, '<br />')}</p>`
    ).join('\n');
  }
  
  // Sanitize the processed HTML
  return sanitizeHtml(processed);
};
