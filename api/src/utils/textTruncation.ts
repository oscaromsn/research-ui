/**
 * Smart text truncation utility that respects word boundaries and adds ellipsis
 * when text is actually truncated.
 */

/**
 * Truncates text at word boundaries and adds ellipsis when needed.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the truncated text (including ellipsis)
 * @returns Truncated text with ellipsis if truncation occurred
 */
export function smartTruncate(text: string, maxLength: number): string {
  // Return original text if it's within the limit
  if (!text || text.length <= maxLength) {
    return text;
  }

  // If maxLength is too small to accommodate ellipsis, just truncate
  if (maxLength <= 3) {
    return text.substring(0, maxLength);
  }

  // Reserve space for ellipsis
  const maxContentLength = maxLength - 3;

  // Find the last space before maxContentLength
  const lastSpaceIndex = text.lastIndexOf(" ", maxContentLength);

  // If no space found within range, truncate at maxContentLength
  if (lastSpaceIndex === -1 || lastSpaceIndex === 0) {
    return `${text.substring(0, maxContentLength)}...`;
  }

  // Truncate at the last space and add ellipsis
  return `${text.substring(0, lastSpaceIndex)}...`;
}

/**
 * Truncates text for display in UI components, specifically for summaries.
 * Uses a predefined length that works well for summary snippets.
 *
 * @param text - The text to truncate
 * @returns Truncated text suitable for summary display
 */
export function truncateForSummary(text: string): string {
  return smartTruncate(text, 300);
}

/**
 * Truncates text for display in titles or short descriptions.
 *
 * @param text - The text to truncate
 * @returns Truncated text suitable for title display
 */
export function truncateForTitle(text: string): string {
  return smartTruncate(text, 70);
}

/**
 * Truncates text for display in brief messages or labels.
 *
 * @param text - The text to truncate
 * @returns Truncated text suitable for brief display
 */
export function truncateForBrief(text: string): string {
  return smartTruncate(text, 50);
}

/**
 * Truncates text for reasoning summaries or detailed descriptions.
 *
 * @param text - The text to truncate
 * @returns Truncated text suitable for detailed descriptions
 */
export function truncateForReasoning(text: string): string {
  return smartTruncate(text, 500);
}