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
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
