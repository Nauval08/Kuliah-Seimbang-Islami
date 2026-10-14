/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#183B34',
    tint: '#287568',

    // Core surfaces
    background: '#F5F4EC',
    foreground: '#183B34',

    // Cards / elevated surfaces
    card: '#FFFEFA',
    cardForeground: '#183B34',

    // Primary action color (buttons, links, active states)
    primary: '#287568',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E2EEE6',
    secondaryForeground: '#244D42',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EAEDE4',
    mutedForeground: '#68776E',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E5AD62',
    accentForeground: '#533B1E',

    // Destructive actions (delete, error states)
    destructive: '#B84E42',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#DCE2D8',
    input: '#CBD5CA',
  },

  dark: {
    text: '#E8F1E9',
    tint: '#9CCDBB',
    background: '#132C27',
    foreground: '#E8F1E9',
    card: '#1B3932',
    cardForeground: '#E8F1E9',
    primary: '#91C8B5',
    primaryForeground: '#102720',
    secondary: '#29483F',
    secondaryForeground: '#E4F0E6',
    muted: '#29413A',
    mutedForeground: '#B0C1B6',
    accent: '#D9A85E',
    accentForeground: '#2D2110',
    destructive: '#E17A6D',
    destructiveForeground: '#2B1412',
    border: '#35534A',
    input: '#49655D',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 12,
};

export default colors;
