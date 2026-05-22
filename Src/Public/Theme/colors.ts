export const colorTokens = {
  gray: {
    0: 'var(--color-gray-0)',
    25: 'var(--color-gray-25)',
    50: 'var(--color-gray-50)',
    100: 'var(--color-gray-100)',
    150: 'var(--color-gray-150)',
    200: 'var(--color-gray-200)',
    300: 'var(--color-gray-300)',
    400: 'var(--color-gray-400)',
    500: 'var(--color-gray-500)',
    700: 'var(--color-gray-700)',
    900: 'var(--color-gray-900)',
  },
  amber: {
    50: 'var(--color-amber-50)',
    100: 'var(--color-amber-100)',
    200: 'var(--color-amber-200)',
    300: 'var(--color-amber-300)',
    400: 'var(--color-amber-400)',
    500: 'var(--color-amber-500)',
  },
  blue: {
    50: 'var(--color-blue-50)',
    100: 'var(--color-blue-100)',
    200: 'var(--color-blue-200)',
    300: 'var(--color-blue-300)',
    400: 'var(--color-blue-400)',
    500: 'var(--color-blue-500)',
  },
  success: {
    50: 'var(--color-success-50)',
    500: 'var(--color-success-500)',
  },
  warning: {
    50: 'var(--color-warning-50)',
    500: 'var(--color-warning-500)',
  },
  danger: {
    50: 'var(--color-danger-50)',
    500: 'var(--color-danger-500)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
    quiet: 'var(--color-text-quiet)',
    inverse: 'var(--color-text-inverse)',
  },
  border: {
    soft: 'var(--color-border-soft)',
    default: 'var(--color-border-default)',
    strong: 'var(--color-border-strong)',
    accent: 'var(--color-border-accent)',
    info: 'var(--color-border-info)',
  },
  surface: {
    base: 'var(--color-surface-base)',
    elevated: 'var(--color-surface-elevated)',
    soft: 'var(--color-surface-soft)',
    muted: 'var(--color-surface-muted)',
    accent: 'var(--color-surface-accent)',
    info: 'var(--color-surface-info)',
  },
} as const;

export const gradientTokens = {
  appShell: 'var(--gradient-app-shell)',
  appFrame: 'var(--gradient-app-frame)',
  mainStage: 'var(--gradient-main-stage)',
  sidebar: 'var(--gradient-sidebar)',
  card: 'var(--gradient-card)',
  cardSoft: 'var(--gradient-card-soft)',
  amber: 'var(--gradient-amber)',
  blue: 'var(--gradient-blue)',
  frost: 'var(--gradient-frost)',
  focusRing: 'var(--gradient-focus-ring)',
} as const;

export const shadowTokens = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  amber: 'var(--shadow-amber)',
  blue: 'var(--shadow-blue)',
} as const;

export const glowTokens = {
  amber: 'var(--glow-amber)',
  blue: 'var(--glow-blue)',
} as const;

export const componentColorTokens = {
  app: {
    shellBg: 'var(--component-app-shell-bg)',
    frameBg: 'var(--component-app-frame-bg)',
    stageBg: 'var(--component-main-stage-bg)',
  },
  sidebar: {
    bg: 'var(--component-sidebar-bg)',
    border: 'var(--component-sidebar-border)',
  },
  navigation: {
    itemBg: 'var(--component-nav-item-bg)',
    itemHoverBg: 'var(--component-nav-item-hover-bg)',
    itemActiveBg: 'var(--component-nav-item-active-bg)',
    itemActiveText: 'var(--component-nav-item-active-text)',
    iconBg: 'var(--component-nav-icon-bg)',
    iconActiveBg: 'var(--component-nav-icon-active-bg)',
    iconActiveText: 'var(--component-nav-icon-active-text)',
  },
  layout: {
    headerBg: 'var(--component-layout-header-bg)',
    headerBorder: 'var(--component-layout-header-border)',
    title: 'var(--component-layout-title)',
    subtitle: 'var(--component-layout-subtitle)',
    kicker: 'var(--component-layout-kicker)',
  },
  panel: {
    bg: 'var(--component-panel-bg)',
    softBg: 'var(--component-panel-soft-bg)',
    border: 'var(--component-panel-border)',
    shadow: 'var(--component-panel-shadow)',
  },
  accent: {
    amberBg: 'var(--component-accent-amber-bg)',
    blueBg: 'var(--component-accent-blue-bg)',
    amberText: 'var(--component-accent-amber-text)',
    blueText: 'var(--component-accent-blue-text)',
  },
} as const;

export type ColorTokens = typeof colorTokens;
export type GradientTokens = typeof gradientTokens;
export type ShadowTokens = typeof shadowTokens;
export type GlowTokens = typeof glowTokens;
export type ComponentColorTokens = typeof componentColorTokens;
