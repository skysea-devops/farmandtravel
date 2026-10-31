// Gumroad billing. Tek hesap (store), market başına bir ürün (permalink):
//   tr   -> topraklayeniden.gumroad.com/l/uyelik             (topraklayeniden.com)
//   intl -> topraklayeniden.gumroad.com/l/reconnect-membership (reconnectwithsoil.com)
// Her ürün içinde iki ödeme sıklığı (yıllık + 3 aylık); sıklığı müşteri checkout'ta seçer.
//
// Lambda kapalı VPC'de, internet çıkışı YOK → Gumroad API'yi çağıramayız. Checkout
// sadece bir URL üretir (outbound yok); üyenin kimliği member_id olarak URL'e iliştirilir
// ve Gumroad bunu webhook'ta url_params[member_id] olarak geri gönderir. Webhook inbound
// (API Gateway) olduğundan egress gerektirmez; doğrulama URL'deki gizli token ile yapılır.
import { env } from "../../shared/config/env.js";

export type Market = "tr" | "intl";

export function billingConfigured(): boolean {
  return Boolean(
    env.GUMROAD_STORE && env.GUMROAD_PERMALINK_TR && env.GUMROAD_PERMALINK_INTL && env.GUMROAD_WEBHOOK_TOKEN,
  );
}

export function permalinkFor(market: Market): string | undefined {
  return market === "intl" ? env.GUMROAD_PERMALINK_INTL : env.GUMROAD_PERMALINK_TR;
}

// Gumroad gelen webhook'ta permalink'i (kısa ya da tam URL) döner; hangisine ait olduğunu
// içerip içermediğine bakarak market'e eşleriz. INTL önce kontrol edilir.
export function marketOfPermalink(permalink: string | null): Market {
  const intl = env.GUMROAD_PERMALINK_INTL;
  if (permalink && intl && permalink.includes(intl)) return "intl";
  return "tr";
}

// Hosted Gumroad checkout URL'i. member_id url_params olarak taşınır (webhook'ta döner),
// wanted=true doğrudan ödeme ekranını açar.
export function checkoutUrl(memberId: string, _email: string | null, market: Market): string {
  const permalink = permalinkFor(market);
  if (!billingConfigured() || !permalink) throw new Error("billing_unconfigured");
  const base = `https://${env.GUMROAD_STORE}.gumroad.com/l/${permalink}`;
  const params = new URLSearchParams();
  params.set("member_id", memberId); // Gumroad'ın tanımadığı param → url_params[member_id] olarak döner
  params.set("wanted", "true");
  return `${base}?${params.toString()}`;
}

// recurrence → abonelik bitiş tarihi (bir sonraki yenilemeye kadar). ~2 gün tolerans.
export function periodEnd(recurrence: string | null, from: Date = new Date()): Date {
  const d = new Date(from);
  switch ((recurrence ?? "").toLowerCase()) {
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "biannually": d.setMonth(d.getMonth() + 6); break;
    case "yearly": default: d.setFullYear(d.getFullYear() + 1); break;
  }
  d.setDate(d.getDate() + 2); // yenileme gecikmesi için küçük tolerans
  return d;
}
