# Farm & Travel / Toprakla Yeniden — Architecture Decisions (locked)

Living context for the project. This file is the quick-reference of decisions the code and
infra implement. Update it whenever a decision changes so a new chat can continue without redoing work.

## Brand & language
- **Toprakla Yeniden** — primary domain `topraklayeniden.com`, UI **Turkish** for now.
- Later international: `backtolands.com` via CNAME. Language is chosen at the **edge**
  (CloudFront `CloudFront-Viewer-Country` header, or `Accept-Language`), NOT Route 53 geo-routing
  (that keys on the DNS resolver, not the user). Route 53 only splits domains. Frontend is i18n-ready.

## Platform model (UPDATED — supersedes the old 4-membership design)
- Two conceptual sides in one ecosystem: **offering** support and **seeking** support
  (originally framed as Experiences/Workaway + Projects/Wild Minds).
- **Not** crowdfunding: no money flows between users (no donations/escrow/investment).
  Money is only the membership subscription (Lemon Squeezy). "Financial supporter" is just an
  introduction tag; any deal happens off-platform.
- **No fixed membership types / roles.** Everyone is a single `member`. The old
  Explorer/Host/Creator/Supporter are gone as account types.
- **Single flat subscription** for everyone, monthly (price TBD; ₺X placeholder in mockups).
- **Onboarding is a survey**, not a role picker. Free text + quick-picks describe the person's
  situation, what they seek, and what they offer. Answers become **tags**.

## Tag model (core)
- Four axes: `seek` (arıyorum) · `offer` (sunuyorum) · `topic` (interest/category) · `situation` (state).
- **Direction lives in the axis, not the label.** "gönüllü arıyorum" = `seek:volunteers`;
  "gönüllü olmak istiyorum" = `offer:volunteer-labor`. UI shows direction by color (green=offer,
  blue=seek) + verb ("… sunuyor / arıyor").
- **Çiftlik sahibi = `situation:farm-owner`** — a distinct, filterable situation tag (own chip style).
- **Matching** = my `seek` values ∩ others' `offer` values (and vice versa).
- **Controlled taxonomy**, admin-managed (`taxonomy` table, with synonyms). Discovery/matching run on it.
- **AI tagging:** user writes free text → AI maps it to the controlled taxonomy (never invents tags) →
  user confirms/edits. AWS **Bedrock** (Claude Haiku), ~1 call per onboarding. Code: `AI_MODE=stub|bedrock`.

## Access / gating
- **Gated model:** the member app is behind subscription. Public site = marketing + auth + a
  **public teaser Keşfet** (map + cards visible without login) to attract subscribers; connecting/
  contacting requires membership.
- Public site nav = 3 pages: **Ana sayfa · Biz kimiz · Keşfet**.
- Onboarding order: **survey → profile → payment wall** (invest effort before the wall; app still gated).
- Subscription is verified **on every request from Postgres** (not baked into the JWT) → cancel takes
  effect immediately.

## Connection Request & privacy (security core)
- Contact info hidden until BOTH sides accept. Pre-accept a member exposes only first name, country,
  **city**, headline/offer summary, tags, gallery, profile URL.
- **UPDATED:** `city` is **public** (needed for the map). **Exact address stays private.**
  Never exposed pre-accept: surname, exact address, email, phone, LinkedIn/Instagram, employer.
- Enforced at the repository layer via three projections (owner / public / contact). Private columns
  never enter a public query and never enter a search index.
- Connections page has three states/tabs: **Bağlantılarım** (accepted, contact open) · Gelen · Giden.
  State machine: pending → accepted | declined | withdrawn | expired.

## Keşfet / map
- Location-based map; pins colored by direction (green=Destek sunanlar, blue=Destek arayanlar);
  filterable by direction + `situation:farm-owner` + topic/country/language.
- Mockup uses a stylized SVG map. Real build: **Leaflet/MapLibre** (tiles must be added to the network
  allowlist); "Konumuma git" uses browser Geolocation.
- Tab wording locked: **"Destek sunanlar" / "Destek arayanlar"** (not the vague "sunan/arayan").
- Result cards show the **specific** tags ("Uzmanlık sunuyor", "Finansal destek sunuyor",
  "Gönüllü arıyor"…), not just "Destek sunuyor/arıyor".

## Backend (Sprint 1 in repo, `backend/`)
- **TypeScript · Node 20 · Hono lambdalith · Clean Architecture · Repository Pattern · SOLID.**
- Layers: `domain → application → infrastructure → interface`; feature modules (`members`, `tags`).
- Postgres via `pg` (no ORM), raw SQL migrations + repository pattern.
- **Mobile-ready by design:** stateless JSON REST over HTTP API; auth via Cognito JWT (works for web SPA
  and native mobile via Cognito/OAuth PKCE); media via presigned S3 URLs. A future mobile app consumes
  the same API — keep responses client-agnostic (no HTML, no server-rendered state).
- Endpoints so far: `/onboarding/draft`, `/tags/infer`, `/onboarding/tags/confirm`, `/profile` (PUT),
  `/profile/me`, `/taxonomy`, `/health`.

## Infrastructure (locked)
- Region **eu-central-1**. Single prod AWS account `farmandtravel`; develop on prod until go-live.
  Terraform env-parametric (`var.environment`).
- Frontend: React SPA → S3 + CloudFront. API: API Gateway **HTTP API** + Cognito JWT authorizer.
- Compute: single Lambda (lambdalith, the `backend/`).
- Auth: **one** Cognito user pool. Two app clients: **web** (SPA, PKCE, no secret) and **mobile**
  (public client, PKCE). `admin` group for moderation. Member roles are tags in Postgres, not pool groups.
- DB: **RDS PostgreSQL db.t4g.micro Single-AZ**. Not Aurora, not DynamoDB for core data (multi-attribute
  filtering + relational). DynamoDB only for narrow key needs (e.g. LS webhook idempotency, TTL).
- Lambda↔RDS: no RDS Proxy at MVP; add (~$15/mo) when concurrency rises.
- Networking: Lambda in private subnets, RDS private/closed. **No NAT.** Free S3 gateway endpoint;
  SES/Bedrock interface endpoints (~$7 each) added when wired. Bedrock is called from Lambda (in VPC),
  so a `bedrock-runtime` interface endpoint is needed, or route that one call outside VPC.
- Storage: S3 + CloudFront; scoped presigned URLs. Secrets: static → SSM Parameter Store (SecureString);
  DB master password → RDS-managed secret.
- Async: single SQS queue for Lemon Squeezy webhooks (idempotent). No EventBridge yet.
- Payments: **Lemon Squeezy** (MoR; handles EU/其 VAT). Abstract behind a thin interface (LS is becoming
  "Stripe Managed Payments" — re-verify before payments sprint).
- IaC: **Terraform ≥ 1.10**, S3 backend with native lockfile locking (no DynamoDB lock table).
  Deploy via **GitHub Actions + OIDC** (no long-lived keys). Default branch: **dev**.
- Tags: Project, Environment, ManagedBy.

## Cost target
- Steady-state MVP ~**$25-32/mo** (RDS ~70%). CloudWatch retention capped early.
- RDS 1-yr No-Upfront RI bought via console on launch day (financial commitment, not in Terraform).

## Status / phases
- **Faz 0 (design) — done:** page inventory + specs (Grup 1-4) + UI/UX mockups (design system,
  public site w/ map, entry funnel, member app). Delivered as HTML mockups.
- **Sprint 0 (infra bootstrap) — partially done:** bootstrap scripts (IAM OIDC + state bucket),
  network + observability modules, environments/prod skeleton. Cognito/RDS/Lambda/API GW/S3 modules
  being added next.
- **Sprint 1 (backend vertical slice) — in repo `backend/`:** onboarding → AI tagging → profile.
- Next: Sprint 2 discovery (`/search`, `/dashboard`, matching) + S3 presign; Sprint 3 connections +
  privacy endpoints + messaging; Sprint 4 payments/gating; Sprint 5 email/notifications/GDPR;
  Sprint 6 hardening + launch.

## Where things live in this repo
- `backend/` — the Hono lambdalith (Sprint 1+). See `backend/README.md`.
- `frontend/` — Vite React SPA.
- `environments/prod/` — Terraform root (wires modules).
- `modules/` — Terraform modules (network, observability, + cognito/rds/lambda/apigw/s3 as added).
- `bootstrap/` — one-time hand-run scripts.
- `docs/` — this file + aws-cli notes.
