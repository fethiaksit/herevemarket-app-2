export const computeDiscount = ({ coupon, subtotal }) => {
  if (!coupon) return { discountAmount: 0, discountedTotal: subtotal };
  let discountAmount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
  return { discountAmount, discountedTotal: Math.max(0, subtotal - discountAmount) };
};
