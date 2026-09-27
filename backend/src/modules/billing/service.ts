// Lemon Squeezy billing. One provider, two variants priced per market:
//   tr   -> $20/yr (Toprak,  topraklayeniden.com)
//   intl -> $40/yr (Return,  reconnectwithsoil.com)
//
// The Lambda runs in a closed VPC with NO internet egress, so we CANNOT call the LS
// API. Instead we build a hosted "buy link" (a plain URL, no outbound request) and
// redirect the browser to it. The webhook (inbound via API Gateway) keeps state in
// sync and only touches RDS, so it needs no egress either.
import { env } from "../../shared/config/env.js";

export type Market = "tr" | "intl";

export function billingConfigured(): boolean {
  return Boolean(env.LS_STORE && env.LS_VARIANT_TR && env.LS_VARIANT_INTL);
}

export function variantFor(market: Market): string | undefined {
  return market === "intl" ? env.LS_VARIANT_INTL : env.LS_VARIANT_TR;
}

export function marketOfVariant(variantId: string | null): Market {
  return variantId && variantId === env.LS_VARIANT_INTL ? "intl" : "tr";
}

// Build a Lemon Squeezy hosted checkout URL. member_id rides along as custom data so
// the webhook can map the resulting subscription back to the member.
export function checkoutUrl(memberId: string, email: string | null, market: Market): string {
  const variant = variantFor(market);
  if (!billingConfigured() || !variant) throw new Error("billing_unconfigured");
  const base = `https://${env.LS_STORE}.lemonsqueezy.com/checkout/buy/${variant}`;
  const params = new URLSearchParams();
  params.set("checkout[custom][member_id]", memberId);
  if (email) params.set("checkout[email]", email);
  return `${base}?${params.toString()}`;
}
