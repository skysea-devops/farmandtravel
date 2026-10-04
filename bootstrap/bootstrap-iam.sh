#!/usr/bin/env bash
#
# Sprint 0 - IAM bootstrap for the PROD account (run ONCE, by hand; safe to re-run).
#
# Creates:
#   1) A GitHub Actions OIDC identity provider (if not already present)
#   2) tf-deploy role (AdministratorAccess) — assumable ONLY from branch pushes of this
#      repo (refs/heads/*: covers push-to-prod apply + workflow_run/dispatch deploys).
#      Pull requests CANNOT assume it, so a malicious PR can't reach AWS admin.
#   3) tf-plan role (ReadOnlyAccess) — assumable ONLY from this repo's pull_request
#      context, used by the PR `terraform plan` job (read-only, -lock=false).
#
# Security boundary = the trust policy (single repo + context split), not permission
# breadth. Admin on the deploy role is still broad; swapping it for a scoped policy +
# GitHub environment approval is a later hardening step.
#
# Run from an admin/root session already authenticated to the PROD account. AWS CLI v2.
#
set -euo pipefail

# ---- Fill these in -----------------------------------------------------------
PROJECT="farmandtravel"          # project slug (resource names + tags)
GITHUB_ORG="skysea-devops"       # your GitHub org or username
GITHUB_REPO="farmandtravel"      # the repo that runs Terraform
# This org has GitHub's OIDC "subject claim" customization enabled, so the token
# sub includes IMMUTABLE numeric ids: repo:ORG@<orgId>/REPO@<repoId>:<context>.
# A trust policy without these ids will NOT match and STS returns
# "Not authorized to perform sts:AssumeRoleWithWebIdentity".
#   org id : https://api.github.com/orgs/skysea-devops        -> .id
#   repo id: https://api.github.com/repos/skysea-devops/farmandtravel -> .id
# Leave either blank to fall back to the plain repo:ORG/REPO form (no id customization).
GITHUB_ORG_ID="67606913"         # skysea-devops org id
GITHUB_REPO_ID="1311877836"      # farmandtravel repo id
# ------------------------------------------------------------------------------

OIDC_HOST="token.actions.githubusercontent.com"
DEPLOY_ROLE_NAME="${PROJECT}-prod-tf-deploy"
PLAN_ROLE_NAME="${PROJECT}-prod-tf-plan"
# Subject prefix, matching the org's OIDC subject-claim format (with ids when set).
if [[ -n "${GITHUB_ORG_ID}" && -n "${GITHUB_REPO_ID}" ]]; then
  REPO="repo:${GITHUB_ORG}@${GITHUB_ORG_ID}/${GITHUB_REPO}@${GITHUB_REPO_ID}"
else
  REPO="repo:${GITHUB_ORG}/${GITHUB_REPO}"
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
CALLER_ARN="$(aws sts get-caller-identity --query Arn --output text)"
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_HOST}"

echo "IAM bootstrap"
echo "  Account : ${ACCOUNT_ID}"
echo "  Caller  : ${CALLER_ARN}"
echo "  Repo    : ${GITHUB_ORG}/${GITHUB_REPO}"
echo "  Roles   : ${DEPLOY_ROLE_NAME} (branch pushes), ${PLAN_ROLE_NAME} (PRs, read-only)"
echo ""
read -r -p "Is this the correct PROD account? [y/N] " ok
[[ "${ok}" == "y" || "${ok}" == "Y" ]] || { echo "Aborted."; exit 1; }

# ---- 1) OIDC provider (idempotent; AWS fetches the thumbprint automatically) --
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${OIDC_ARN}" >/dev/null 2>&1; then
  echo "OIDC provider already exists, skipping."
else
  aws iam create-open-id-connect-provider --url "https://${OIDC_HOST}" --client-id-list "sts.amazonaws.com"
  echo "Created OIDC provider."
fi

# Helper: create-or-update a role's trust policy.
upsert_role() {
  local name="$1" trust="$2" desc="$3"
  if aws iam get-role --role-name "${name}" >/dev/null 2>&1; then
    echo "Role ${name} exists; updating trust policy."
    aws iam update-assume-role-policy --role-name "${name}" --policy-document "${trust}"
  else
    aws iam create-role --role-name "${name}" --assume-role-policy-document "${trust}" \
      --description "${desc}" \
      --tags "Key=Project,Value=${PROJECT}" "Key=Environment,Value=prod" "Key=ManagedBy,Value=bootstrap"
    echo "Created role ${name}."
  fi
}

# ---- 2) Deploy role: branch pushes only (NOT pull_request) --------------------
DEPLOY_TRUST="$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "${OIDC_ARN}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "${OIDC_HOST}:aud": "sts.amazonaws.com" },
      "StringLike":   { "${OIDC_HOST}:sub": "${REPO}:ref:refs/heads/*" }
    }
  }]
}
JSON
)"
upsert_role "${DEPLOY_ROLE_NAME}" "${DEPLOY_TRUST}" "Terraform deploy (branch pushes only, OIDC)"
aws iam attach-role-policy --role-name "${DEPLOY_ROLE_NAME}" \
  --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess"

# ---- 3) Plan role: pull_request only, read-only -------------------------------
PLAN_TRUST="$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "${OIDC_ARN}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "${OIDC_HOST}:aud": "sts.amazonaws.com",
        "${OIDC_HOST}:sub": "${REPO}:pull_request"
      }
    }
  }]
}
JSON
)"
upsert_role "${PLAN_ROLE_NAME}" "${PLAN_TRUST}" "Terraform plan (PRs, read-only, OIDC)"
aws iam attach-role-policy --role-name "${PLAN_ROLE_NAME}" \
  --policy-arn "arn:aws:iam::aws:policy/ReadOnlyAccess"

echo ""
echo "Done."
echo "  Deploy role ARN: arn:aws:iam::${ACCOUNT_ID}:role/${DEPLOY_ROLE_NAME}  (apply + deploys)"
echo "  Plan role ARN  : arn:aws:iam::${ACCOUNT_ID}:role/${PLAN_ROLE_NAME}    (PR plan, read-only)"
