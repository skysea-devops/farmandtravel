#!/usr/bin/env bash
#
# Sprint 0 - IAM bootstrap for the PROD account (run ONCE, by hand).
#
# Creates:
#   1) A GitHub Actions OIDC identity provider (if not already present)
#   2) A Terraform deploy role that ONLY this repo's `main` branch can assume via OIDC
#
# Does NOT create any long-lived access keys.
# Security boundary = the *trust policy* (single repo + single branch + no secrets),
# not the permission breadth. The role gets AdministratorAccess for now because it
# provisions VPC/RDS/Lambda/Cognito/IAM app-roles; real least-privilege is deferred
# (permissions boundary + GitHub environment approval) to Sprint 6 hardening.
#
# Run from an admin/root session already authenticated to the PROD account.
# Safe to re-run: each step is idempotent.
# Requires: AWS CLI v2.
#
set -euo pipefail

# ---- Fill these in -----------------------------------------------------------
PROJECT="farmandtravel"          # project slug (resource names + tags)
GITHUB_ORG="skysea-devops"           # your GitHub org or username
GITHUB_REPO="farmandtravel"          # the repo that runs Terraform
DEPLOY_BRANCH="main"             # only this branch may deploy to prod
# ------------------------------------------------------------------------------

OIDC_HOST="token.actions.githubusercontent.com"
ROLE_NAME="${PROJECT}-prod-tf-deploy"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
CALLER_ARN="$(aws sts get-caller-identity --query Arn --output text)"
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_HOST}"

echo "IAM bootstrap"
echo "  Account : ${ACCOUNT_ID}"
echo "  Caller  : ${CALLER_ARN}"
echo "  Repo    : ${GITHUB_ORG}/${GITHUB_REPO} (branch: ${DEPLOY_BRANCH})"
echo "  Role    : ${ROLE_NAME}"
echo ""
if [[ "${GITHUB_ORG}" == "CHANGE_ME" || "${GITHUB_REPO}" == "CHANGE_ME" ]]; then
  echo "ERROR: set GITHUB_ORG and GITHUB_REPO first." >&2
  exit 1
fi
read -r -p "Is this the correct PROD account? [y/N] " ok
[[ "${ok}" == "y" || "${ok}" == "Y" ]] || { echo "Aborted."; exit 1; }

# ---- 1) OIDC provider (idempotent; AWS fetches the thumbprint automatically) --
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${OIDC_ARN}" >/dev/null 2>&1; then
  echo "OIDC provider already exists, skipping."
else
  aws iam create-open-id-connect-provider \
    --url "https://${OIDC_HOST}" \
    --client-id-list "sts.amazonaws.com"
  echo "Created OIDC provider."
fi

# ---- 2) Deploy role with a narrow trust policy -------------------------------
TRUST_POLICY="$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "${OIDC_ARN}" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": { "${OIDC_HOST}:aud": "sts.amazonaws.com" },
        "StringLike":   { "${OIDC_HOST}:sub": "repo:${GITHUB_ORG}/${GITHUB_REPO}:ref:refs/heads/${DEPLOY_BRANCH}" }
      }
    }
  ]
}
JSON
)"

if aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
  echo "Role exists; updating trust policy."
  aws iam update-assume-role-policy --role-name "${ROLE_NAME}" --policy-document "${TRUST_POLICY}"
else
  aws iam create-role \
    --role-name "${ROLE_NAME}" \
    --assume-role-policy-document "${TRUST_POLICY}" \
    --description "Terraform deploy role for ${GITHUB_ORG}/${GITHUB_REPO}@${DEPLOY_BRANCH} (OIDC only)" \
    --tags "Key=Project,Value=${PROJECT}" "Key=Environment,Value=prod" "Key=ManagedBy,Value=bootstrap"
  echo "Created role ${ROLE_NAME}."
fi

aws iam attach-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess"

echo ""
echo "Done."
echo "  Role ARN: arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "  -> Set this as GitHub secret AWS_DEPLOY_ROLE_ARN in ${GITHUB_ORG}/${GITHUB_REPO}."
