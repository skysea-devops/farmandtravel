#!/usr/bin/env bash
#
# Sprint 0 - Terraform state backend bootstrap for the PROD account (run ONCE).
#
# Creates ONE durable S3 bucket for Terraform state:
#   - versioning (recover from corrupted/lost state)
#   - default encryption (SSE-S3 / AES256, free)
#   - full public access block
#   - bucket-owner-enforced ownership (ACLs disabled)
#   - TLS-only bucket policy (deny non-HTTPS)
#
# No DynamoDB lock table: Terraform >= 1.10 uses native S3 lockfile locking.
#
# Run from an admin/root session authenticated to the PROD account.
# Safe to re-run: every step is idempotent.
# Requires: AWS CLI v2.
#
set -euo pipefail

# ---- Config ------------------------------------------------------------------
AWS_REGION="eu-central-1"
PROJECT="farmandtravel"
# ------------------------------------------------------------------------------

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
CALLER_ARN="$(aws sts get-caller-identity --query Arn --output text)"
BUCKET="${PROJECT}-tfstate-${ACCOUNT_ID}"

echo "Terraform state bootstrap"
echo "  Account : ${ACCOUNT_ID}"
echo "  Caller  : ${CALLER_ARN}"
echo "  Region  : ${AWS_REGION}"
echo "  Bucket  : ${BUCKET}"
echo ""
read -r -p "Is this the correct PROD account? [y/N] " ok
[[ "${ok}" == "y" || "${ok}" == "Y" ]] || { echo "Aborted."; exit 1; }

# ---- 1) Create bucket (idempotent) ------------------------------------------
if aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  echo "Bucket already exists, skipping create."
else
  aws s3api create-bucket \
    --bucket "${BUCKET}" \
    --region "${AWS_REGION}" \
    --create-bucket-configuration "LocationConstraint=${AWS_REGION}"
  echo "Created ${BUCKET}."
fi

# ---- 2) Block all public access ---------------------------------------------
aws s3api put-public-access-block \
  --bucket "${BUCKET}" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# ---- 3) Enforce bucket-owner ownership (disable ACLs) -----------------------
aws s3api put-bucket-ownership-controls \
  --bucket "${BUCKET}" \
  --ownership-controls "Rules=[{ObjectOwnership=BucketOwnerEnforced}]"

# ---- 4) Enable versioning ----------------------------------------------------
aws s3api put-bucket-versioning \
  --bucket "${BUCKET}" \
  --versioning-configuration "Status=Enabled"

# ---- 5) Default encryption (SSE-S3 / AES256) --------------------------------
aws s3api put-bucket-encryption \
  --bucket "${BUCKET}" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": { "SSEAlgorithm": "AES256" },
      "BucketKeyEnabled": true
    }]
  }'

# ---- 6) TLS-only bucket policy (deny non-HTTPS) -----------------------------
aws s3api put-bucket-policy \
  --bucket "${BUCKET}" \
  --policy "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::${BUCKET}",
        "arn:aws:s3:::${BUCKET}/*"
      ],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    }
  ]
}
JSON
)"

echo ""
echo "Done. Put this into environments/prod/backend.tf:"
echo "  bucket = \"${BUCKET}\""
echo "  region = \"${AWS_REGION}\""
