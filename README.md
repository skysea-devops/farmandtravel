# Farm & Travel / Toprakla Yeniden — Monorepo

Two-sided eco/farm community SaaS. Brand **Toprakla Yeniden** (`topraklayeniden.com`, TR;
`backtolands.com` international later). Region `eu-central-1`, single prod account `farmandtravel`.
Serverless: React SPA + Hono lambdalith on AWS Lambda + API Gateway HTTP API + RDS PostgreSQL + Cognito.
A **mobile app is planned**; the backend is a stateless JSON API so web and mobile share it.

> Read `docs/PROJECT_CONTEXT.md` first — it holds all locked product & infra decisions so a new
> chat/session can continue without redoing the design.

## Layout
```
frontend/                  Vite React SPA (web)
backend/                   Hono lambdalith API (TypeScript, clean architecture) — see backend/README.md
bootstrap/                 one-time, hand-run scripts (resources Terraform needs to exist first)
  bootstrap-iam.sh         GitHub OIDC provider + branch-scoped Terraform deploy role
  bootstrap-state.sh       S3 state bucket (versioned, encrypted, TLS-only, public-blocked)
modules/                   Terraform modules
  network/                 VPC, public/private subnets, routing, S3 gateway endpoint, SGs (no NAT)
  observability/           CloudWatch app log group + retention, monthly budget alerts
  cognito/                 user pool + web & mobile app clients (PKCE) + admin group
  (rds/ lambda/ apigw/ s3/ — added as sprints land)
environments/
  prod/                    Terraform root; wires the modules, holds backend + tfvars
.github/workflows/
  terraform.yml            fmt/validate on PR; init/plan/apply on push to default branch
docs/
  PROJECT_CONTEXT.md       locked architecture & product decisions (source of truth)
  aws-cli.md               aws cli notes
```

## Backend
See `backend/README.md`. Local: docker Postgres + `npm run migrate && npm run seed && npm run dev`.
Mobile-ready: JSON REST, Cognito JWT (web SPA + native via PKCE), presigned S3 media — no server-rendered state.

## First-time setup (run once, in order)

1. **IAM bootstrap** — edit `GITHUB_ORG`/`GITHUB_REPO` in `bootstrap/bootstrap-iam.sh`,
   then run it with an admin/root session on the prod account. Copy the printed role ARN
   into a GitHub repo secret named `AWS_DEPLOY_ROLE_ARN`.

2. **State bucket** — run `bootstrap/bootstrap-state.sh` (same admin session).
   It prints the exact bucket name.

3. **Wire the backend** — in `environments/prod/backend.tf`, replace `<ACCOUNT_ID>`
   with your 12-digit account id (matches the bucket name from step 2).

4. **Set your email** — in `environments/prod/terraform.tfvars`, set `budget_alert_email`.

## Deploy

Local (from `environments/prod/`):
```bash
terraform init
terraform plan
terraform apply
```

CI: push to `main` runs plan + apply automatically via the OIDC role.
Pull requests run `fmt`/`validate` only (no AWS access — trust policy is main-only).

## What this stands up
Sprint 0: a VPC with 2 public + 2 private subnets across 2 AZs, an internet gateway (public only),
a private route table with **no** internet route, a free S3 gateway endpoint, baseline
Lambda/RDS security groups, an application CloudWatch log group with retention, and a
monthly cost budget with email alerts. No NAT.

Being added (auth + data + compute): **Cognito** user pool with web + mobile app clients,
RDS PostgreSQL (t4g.micro, private), the Lambda + API Gateway HTTP API with a Cognito JWT
authorizer, and S3 (media + SPA hosting).
