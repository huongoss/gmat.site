// November promotion configuration (self-contained). Remove this file to disable.
export interface Promotion {
  code: string;
  discountPercent: number; // 0-100
  expiresAt: string; // ISO date for client-side display only
  displayUntil?: string; // separate optional banner hide date
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  highlightColor?: string;
}

export const NOVEMBER_PROMO: Promotion = {
  code: 'NOV90',
  discountPercent: 90,
  expiresAt: '2025-11-30T23:59:59Z',
  displayUntil: '2025-11-30T23:59:59Z',
  heading: 'November Flash: 90% OFF First Month',
  subheading: 'Use code NOV90 at checkout. Limited time this November only.',
  ctaLabel: 'Copy Code & Subscribe',
  highlightColor: '#ff6b00'
};

export function isPromoActive(promo: Promotion): boolean {
  const now = Date.now();
  const exp = Date.parse(promo.expiresAt);
  return now < exp;
}
