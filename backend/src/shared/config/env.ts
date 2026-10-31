// Ortam değişkenleri — tek yerden okunur, zod ile doğrulanır.
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string(),
  AUTH_MODE: z.enum(["dev", "cognito"]).default("dev"),
  DEV_FAKE_SUB: z.string().default("dev-user-1"),
  COGNITO_REGION: z.string().default("eu-central-1"),
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  // Members who join before this date are free "frontier"; later ones need a subscription.
  // Kept far out until Lemon Squeezy billing is live, then set to the real launch date.
  FRONTIER_CUTOFF: z.string().default("2027-01-01T00:00:00+03:00"),
  AI_MODE: z.enum(["stub", "bedrock"]).default("stub"),
  BEDROCK_REGION: z.string().default("eu-central-1"),
  BEDROCK_MODEL_ID: z.string().default("anthropic.claude-3-haiku-20240307-v1:0"),
  AWS_REGION: z.string().default("eu-central-1"),
  MEDIA_BUCKET: z.string().optional(),
  // Comma-separated allowed web origins for CORS. Empty/unset = permissive (local dev).
  ALLOWED_ORIGINS: z.string().optional(),
  // --- Lemon Squeezy billing (legacy; reddedildi, Gumroad'a geçildi) ---
  LS_STORE: z.string().optional(),
  LS_VARIANT_TR: z.string().optional(),
  LS_VARIANT_INTL: z.string().optional(),
  LS_WEBHOOK_SECRET: z.string().optional(),
  // --- Gumroad billing (empty until configured → checkout returns 503) ---
  // Hosted "buy links" (no outbound API call → no-egress VPC'de çalışır). Webhook
  // kapalı VPC'den Gumroad API'yi çağıramadığı için doğrulama URL'deki gizli token ile.
  GUMROAD_STORE: z.string().optional(),          // store subdomain, e.g. "topraklayeniden"
  GUMROAD_PERMALINK_TR: z.string().optional(),   // TR ürün permalink, e.g. "uyelik"
  GUMROAD_PERMALINK_INTL: z.string().optional(), // EN ürün permalink, e.g. "reconnect-membership"
  GUMROAD_WEBHOOK_TOKEN: z.string().optional(),  // webhook URL'inde ?token=... doğrulaması
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
