# Farm & Travel — Architecture Decisions (locked)

Living context for the project. Full narrative context lives in the handoff prompt;
this file is the quick-reference of decisions the infra implements.

## Platform
- Two modules, one ecosystem: **Experiences** (Workaway-style) + **Projects** (Wild Minds-style).
- **Not** crowdfunding: no money flows between users. Money only for membership subscriptions (Lemon Squeezy).
- 4 membership types: Experience Explorer (€35/yr, paid), Experience Host (free),
  Project Creator (€25/mo, paid), Supporter (free).
- **Connection Request** is security-critical: contact info hidden until both sides accept.
  Pre-accept, a Supporter exposes only first name, country, expertise, profile URL.
  Never exposed: surname, city, email, phone, LinkedIn, Instagram, employer.
  Enforced at the repository/API layer; hidden fields never enter a search index.

## Infrastructure (locked)
- Region: **eu-central-1** (Frankfurt) — GDPR/data residency + low latency.
- Single prod AWS account `farmandtravel`; develop directly on prod until go-live.
  Terraform is env-parametric (`var.environment`) so a dev env is nearly free later.
- Frontend: React SPA -> S3 + CloudFront.
- API: API Gateway **HTTP API** + Cognito JWT authorizer.
- Compute: single Lambda ("lambdalith"), Hono router, Clean Architecture + Repository + SOLID.
- Auth: **one** Cognito user pool; 4 roles via groups/attributes; role profile data in Postgres.
- DB: **RDS PostgreSQL db.t4g.micro Single-AZ**. Not Aurora, not DynamoDB for core data.
  DynamoDB only for narrow key-based needs (e.g. Lemon Squeezy webhook idempotency, TTL).
- Lambda<->RDS: no RDS Proxy at MVP; add (~$15/mo) when concurrency rises.
- Networking: Lambda in private subnets, RDS private/closed. **No NAT gateway.**
  Free S3 gateway endpoint; SES interface endpoint (~$7) added when SES is wired.
- Storage: S3 + CloudFront; scoped presigned URLs.
- Email: SES (transactional only at MVP).
- Secrets: static -> SSM Parameter Store (SecureString); DB master password -> RDS-managed secret.
- Async: single SQS queue for Lemon Squeezy webhooks (idempotent). No EventBridge yet.
- Payments: **Lemon Squeezy** (merchant of record; handles EU VAT). Abstract behind a thin
  interface (LS is becoming "Stripe Managed Payments" — re-verify before Sprint 4).
- IaC: **Terraform** (>= 1.10), S3 remote backend with **native lockfile locking** (no DynamoDB
  lock table). Deploy via **GitHub Actions + OIDC** (no long-lived AWS keys).
- Tags: Project, Environment, ManagedBy.

## Cost target
- Steady-state MVP ~**$25-32/mo** (RDS ~70%). CloudWatch retention capped early.
- RDS 1-yr No-Upfront RI bought via console on launch day (financial commitment, not in Terraform).

## Sprints
0 Bootstrap (this repo) · 1 Auth + core data + API skeleton · 2 Experiences ·
3 Projects + Connection Request · 4 Payments/gating (Lemon Squeezy) ·
5 Email/media/notifications/polish · 6 Hardening + launch.
