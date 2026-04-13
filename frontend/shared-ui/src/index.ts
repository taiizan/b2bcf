// ═══════════════════════════════════════════════════════════════
// B2B Coffee Wholesale — Shared UI Design Tokens & Utilities
// ═══════════════════════════════════════════════════════════════

// ── Color Palette — Coffee-themed Premium Dark Mode ──────────
export const colors = {
  // Primary (Rich espresso brown)
  primary: {
    50: '#fdf8f0',
    100: '#f8edd8',
    200: '#f0d7ab',
    300: '#e5b96e',
    400: '#d99a3e',
    500: '#c47f1a',   // Main
    600: '#a66414',
    700: '#854c12',
    800: '#6d3d16',
    900: '#5a3316',
  },
  // Accent (Coffee cherry red)
  accent: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#f8a4a4',
    400: '#f27272',
    500: '#e84545',   // Main
    600: '#d42525',
    700: '#b21c1c',
    800: '#941c1c',
    900: '#7e1d1d',
  },
  // Success (Green bean)
  success: {
    50: '#f0fdf4',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
  },
  // Warning (Honey process)
  warning: {
    50: '#fffbeb',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  // Dark theme (Roasted coffee tones)
  dark: {
    50: '#f8f5f0',
    100: '#e8e0d4',
    200: '#d4c8b8',
    300: '#b5a48e',
    400: '#8b7355',
    500: '#6b5641',
    600: '#4a3728',
    700: '#362818',
    800: '#271d11',
    900: '#1a130b',
    950: '#0f0b07',
  },
};

// ── Typography ───────────────────────────────────────────────
export const fonts = {
  heading: "'Inter', 'Outfit', sans-serif",
  body: "'Inter', system-ui, sans-serif",
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
