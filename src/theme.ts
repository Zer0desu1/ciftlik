/**
 * The look, after the reference: a warm cream page, white cards with soft
 * corners, one deep green for anything you can press, and a pastel tint per
 * kind of thing (green for crops, blue for water, amber for produce, rose for
 * animals) so a glance at a card's chip says what it is about.
 */
export const C = {
  page: '#F4F0E6',
  card: '#FFFFFF',
  cardSoft: '#FAF7F0',
  ink: '#1C2A20',
  inkSoft: '#5E6B60',
  muted: '#9AA197',
  line: '#E8E2D4',
  green: '#1F5C3A',
  greenMid: '#3E8A57',
  greenSoft: '#E2EEDF',
  blue: '#3C7FB5',
  blueSoft: '#DDEBF6',
  amber: '#C98A1B',
  amberSoft: '#F7EACB',
  rose: '#B5594B',
  roseSoft: '#F5E1DB',
  sky: '#BFE0F2',
  danger: '#C2483B',
  white: '#FFFFFF',
} as const;

export const R = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const F = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const shadow = {
  shadowColor: '#3B3220',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
