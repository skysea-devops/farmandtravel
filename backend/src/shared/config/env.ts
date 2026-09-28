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
  AI_MODE: z.enum(["stub", "bedrock"]).default("stub"),
  BEDROCK_REGION: z.string().default("eu-central-1"),
  BEDROCK_MODEL_ID: z.string().default("anthropic.claude-3-haiku-20240307-v1:0"),
  AWS_REGION: z.string().default("eu-central-1"),
  MEDIA_BUCKET: z.string().optional(),
  // Comma-separated allowed web origins for CORS. Empty/unset = permissive (local dev).
  ALLOWED_ORIGINS: z.string().optional(),
  // --- Lemon Squeezy billing (empty until configured → checkout returns 503) ---
  // Uses hosted "buy links" (no outbound API call, works in a no-egress VPC).
  LS_STORE: z.string().optional(), // store subdomain, e.g. "toprakla" → toprakla.lemonsqueezy.com
  LS_VARIANT_TR: z.string().optional(), // $20/yr Toprak variant id (topraklayeniden.com)
  LS_VARIANT_INTL: z.string().optional(), // $40/yr Return variant id (reconnectwithsoil.com)
  LS_WEBHOOK_SECRET: z.string().optional(), // signing secret for webhook verification
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
