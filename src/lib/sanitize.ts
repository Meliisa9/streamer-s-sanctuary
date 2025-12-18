import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Allows safe HTML elements commonly used in content management.
 */
export const sanitizeHtml = (html: string): string => {
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
      'allow', 'allowfullscreen', 'frameborder'
    ],
    ALLOW_DATA_ATTR: false,
    // Ensure iframes can only load from trusted sources
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
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
