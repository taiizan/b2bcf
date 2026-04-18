// ═══════════════════════════════════════════════════════════════
// B2B Coffee Wholesale — Shared UI Design Tokens & Utilities
// ═══════════════════════════════════════════════════════════════

// ── Color Palette — Claude Anthropic System ──────────
export const colors = {
  // Primary (Terracotta Brand)
  primary: {
    50: '#faf9f5', // Ivory
    100: '#f5f4ed', // Parchment
    200: '#e8e6dc', // Border Warm
    300: '#d1cfc5', // Ring Warm
    400: '#d97757', // Coral Accent
    500: '#c96442', // Terracotta Brand
    600: '#b53333', // Error Crimson (used as darker variant here)
    700: '#7e1d1d',
    800: '#5e5d59',
    900: '#141413', // Near Black
  },
  // Accent (Coral / Warm)
  accent: {
    50: '#f0eee6',
    100: '#e8e6dc',
    200: '#d1cfc5',
    300: '#c2c0b6',
    400: '#d97757',
    500: '#b53333', // Crimson
    600: '#941c1c',
    700: '#7e1d1d',
    800: '#4d4c48',
    900: '#3d3d3a',
  },
  // Success (Positive)
  success: {
    50: '#f1f8f3',
    400: '#4ade80',
    500: '#1e873a', // Main
    600: '#007d1e',
  },
  // Warning (Amber)
  warning: {
    50: '#fffbeb',
    400: '#fbbf24',
    500: '#d99118', // Main
    600: '#d97706',
  },
  // Dark/Grayscale theme (Warm Olive/Charcoal)
  dark: {
    50: '#f5f4ed',  // Parchment
    100: '#faf9f5', // Ivory
    200: '#f0eee6', // Border Cream
    300: '#e8e6dc', // Warm Sand
    400: '#d1cfc5', // Ring Warm
    500: '#b0aea5', // Warm Silver
    600: '#87867f', // Stone Gray
    700: '#5e5d59', // Olive Gray
    800: '#4d4c48', // Charcoal Warm
    900: '#30302e', // Dark Surface
    950: '#141413', // Near Black
  },
};

// ── Typography ───────────────────────────────────────────────
export const fonts = {
  heading: "Georgia, 'Times New Roman', Times, serif",
  body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Spacing & Sizing ─────────────────────────────────────────
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

// ── Status Colors ────────────────────────────────────────────
export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: '#fbbf24' },
  CONFIRMED: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6' },
  PROCESSING: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' },
  ROASTING: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: '#f97316' },
  QUALITY_CHECK: { bg: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9', border: '#0ea5e9' },
  SHIPPED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: '#22c55e' },
  DELIVERED: { bg: 'rgba(34, 197, 94, 0.25)', text: '#16a34a', border: '#16a34a' },
  CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#94a3b8' },
  SUBMITTED: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6' },
  QUOTING: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' },
  QUOTED: { bg: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9', border: '#0ea5e9' },
  ACCEPTED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: '#22c55e' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  EXPIRED: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#94a3b8' },
  CLOSED: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: '#6b7280' },
};

// ── Utility Functions ────────────────────────────────────────

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} tấn`;
  return `${kg.toLocaleString()} kg`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string) {
  return statusColors[status] || statusColors.PENDING;
}

export function getVarietyLabel(variety: string): string {
  const labels: Record<string, string> = {
    ARABICA: 'Arabica',
    ROBUSTA: 'Robusta',
    FINE_ROBUSTA: 'Fine Robusta',
    LIBERICA: 'Liberica',
    EXCELSA: 'Excelsa',
  };
  return labels[variety] || variety;
}

export function getProcessingLabel(processing: string): string {
  const labels: Record<string, string> = {
    WASHED: 'Washed', NATURAL: 'Natural',
    HONEY: 'Honey', WET_HULLED: 'Wet Hulled',
  };
  return labels[processing] || processing;
}
