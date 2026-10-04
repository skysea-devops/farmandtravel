data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

module "network" {
  source = "../../modules/network"

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region
  vpc_cidr    = var.vpc_cidr
  az_count    = var.az_count
  azs         = slice(data.aws_availability_zones.available.names, 0, var.az_count)
  ai_mode     = var.ai_mode
}

module "observability" {
  source = "../../modules/observability"

  project                  = var.project
  environment              = var.environment
  log_retention_days       = var.log_retention_days
  budget_monthly_limit_usd = var.budget_monthly_limit_usd
  budget_alert_email       = var.budget_alert_email
}

# Auth — one user pool, web + mobile app clients (PKCE), admin group.
module "cognito" {
  source = "../../modules/cognito"

  project                 = var.project
  environment             = var.environment
  aws_region              = var.aws_region
  hosted_ui_domain_prefix = var.cognito_domain_prefix
  callback_urls           = var.web_callback_urls
  logout_urls             = var.web_logout_urls
  mobile_callback_urls    = var.mobile_callback_urls
}

# Stable DB master password (alnum, no special chars so it's connection-string safe).
# Terraform-managed and stored in state; it does not rotate, so the value in RDS and
# in the Lambda env stay in sync. (random_password is stable across applies once created.)
resource "random_password" "db_master" {
  length  = 32
  special = false
}

# Database — RDS PostgreSQL, private, stable Terraform-managed master password.
module "rds" {
  source = "../../modules/rds"

  project                = var.project
  environment            = var.environment
  subnet_ids             = module.network.private_subnet_ids
  vpc_security_group_ids = [module.network.rds_sg_id]
  master_password        = random_password.db_master.result
}

# Media storage — private bucket, presigned uploads.
locals {
  # All apex domains this deployment serves (primary + optional secondary market).
  site_domains = var.secondary_domain == "" ? [var.domain_name] : [var.domain_name, var.secondary_domain]
  # Real web origins allowed to call the API and PUT to media (CORS): apex + www of each.
  web_origins = flatten([for d in local.site_domains : ["https://${d}", "https://www.${d}"]])
}

module "storage" {
  source = "../../modules/storage"

  project              = var.project
  environment          = var.environment
  cors_allowed_origins = local.web_origins
}

# Frontend hosting — S3 + CloudFront + ACM + Route53 (topraklayeniden.com).
module "site" {
  source = "../../modules/site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project          = var.project
  environment      = var.environment
  domain_name      = var.domain_name
  secondary_domain = var.secondary_domain
}

# Compute — Lambda (lambdalith) + API Gateway HTTP API + Cognito JWT authorizer.
module "api" {
  source = "../../modules/api"

  project            = var.project
  environment        = var.environment
  aws_region         = var.aws_region
  subnet_ids         = module.network.private_subnet_ids
  security_group_ids = [module.network.lambda_sg_id]

  cognito_issuer    = module.cognito.issuer
  cognito_audiences = [module.cognito.web_client_id, module.cognito.mobile_client_id]

  db_host           = module.rds.address
  db_name           = module.rds.db_name
  db_user           = module.rds.username
  db_password       = random_password.db_master.result
  media_bucket_arn  = module.storage.media_bucket_arn
  media_bucket_name = module.storage.media_bucket_name
  allowed_origins   = local.web_origins

  ls_store          = var.ls_store
  ls_variant_tr     = var.ls_variant_tr
  ls_variant_intl   = var.ls_variant_intl
  ls_webhook_secret = var.ls_webhook_secret

  ai_mode            = var.ai_mode
  bedrock_model_id   = var.bedrock_model_id
  frontier_cutoff    = var.frontier_cutoff
  log_retention_days = var.log_retention_days
}
