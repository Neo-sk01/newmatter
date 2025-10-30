/**
 * HTML Converter Utility
 * 
 * Provides functions to convert plain text to HTML and extract plain text from HTML
 * for email sending with proper formatting and XSS protection.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Converts plain text to a full HTML document with proper structure and styling
 * @param text - The plain text content to convert
 * @param subject - The email subject for the title tag
 * @returns A complete HTML document string
 */
export function convertToHtml(text: string, subject: string): string {
  // Split text into paragraphs and wrap each in <p> tags
  const htmlBody = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('\n');

  // Create full HTML document with proper DOCTYPE, meta tags, and inline CSS
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${htmlBody}
</body>
</html>`;
}

/**
 * Strips HTML tags and decodes HTML entities to extract plain text
 * @param html - The HTML content to convert to plain text
 * @returns Plain text with HTML removed and entities decoded
 */
export function stripHtml(html: string): string {
  return html
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    // Clean up extra whitespace
    .trim();
}
