# Farm & Travel — Infrastructure (Terraform)

Env-parametric Terraform for the Farm & Travel platform. Region `eu-central-1`,
single prod account `farmandtravel`. State in S3 with native locking (Terraform >= 1.10,
no DynamoDB lock table). Deploys via GitHub Actions + OIDC (no long-lived AWS keys).

## Layout
```
bootstrap/                 one-time, hand-run scripts (create resources Terraform needs to exist first)
  bootstrap-iam.sh         GitHub OIDC provider + main-branch-scoped Terraform deploy role
  bootstrap-state.sh       S3 state bucket (versioned, encrypted, TLS-only, public-blocked)
modules/
  network/                 VPC, public/private subnets, routing, S3 gateway endpoint, SGs (no NAT)
  observability/           CloudWatch app log group + retention, monthly budget alerts
environments/
  prod/                    root config; wires the modules, holds backend + tfvars
.github/workflows/
  terraform.yml            fmt/validate on PR; init/plan/apply on push to main
docs/
  PROJECT_CONTEXT.md       locked architecture decisions
```

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

## What this stands up (Sprint 0)
A VPC with 2 public + 2 private subnets across 2 AZs, an internet gateway (public only),
a private route table with **no** internet route, a free S3 gateway endpoint, baseline
Lambda/RDS security groups, an application CloudWatch log group with retention, and a
monthly cost budget with email alerts. No NAT, no compute, no database yet — those arrive
in Sprint 1.
