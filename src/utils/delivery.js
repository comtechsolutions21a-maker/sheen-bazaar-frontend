import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Delivery fee rule set by the admin: { fee, freeAbove } (freeAbove 0 = never free)
const DEFAULT = { fee: 49, freeAbove: 499 };
let cached = null;
let pending = null;

export function loadDeliveryRule() {
  if (cached) return Promise.resolve(cached);
  if (!pending) pending = api.getDeliveryRule().then((r) => (cached = { ...DEFAULT, ...r })).catch(() => DEFAULT).finally(() => { pending = null; });
  return pending;
}

export function useDeliveryRule() {
  const [rule, setRule] = useState(cached || DEFAULT);
  useEffect(() => { let live = true; loadDeliveryRule().then((r) => live && setRule(r)); return () => { live = false; }; }, []);
  return rule;
}

export function deliveryFeeFor(itemsTotal, rule) {
  if (!itemsTotal) return 0;
  if (rule.freeAbove > 0 && itemsTotal >= rule.freeAbove) return 0;
  return rule.fee;
}

// "Free delivery on orders above ₹499" (or nothing when delivery is never free / always free)
export function freeDeliveryText(rule) {
  if (!rule.fee) return 'Free delivery on all orders';
  if (rule.freeAbove > 0) return `Free delivery on orders above ₹${rule.freeAbove}`;
  return `Delivery ₹${rule.fee}`;
}
