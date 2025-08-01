/**
 * Mock for Next.js Google Fonts
 * This resolves issues with font imports in test environment
 */
export const Inter = () => ({
  className: "mock-inter-font",
  style: { fontFamily: "'Inter', sans-serif" },
});
