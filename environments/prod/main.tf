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

# Database — RDS PostgreSQL, private, managed master password.
module "rds" {
  source = "../../modules/rds"

  project                = var.project
  environment            = var.environment
  subnet_ids             = module.network.private_subnet_ids
  vpc_security_group_ids = [module.network.rds_sg_id]
}

# Media storage — private bucket, presigned uploads.
module "storage" {
  source = "../../modules/storage"

  project     = var.project
  environment = var.environment
}

# Frontend hosting — S3 + CloudFront + ACM + Route53 (topraklayeniden.com).
module "site" {
  source = "../../modules/site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project     = var.project
  environment = var.environment
  domain_name = var.domain_name
}

# RDS-managed master credentials, read at deploy time and injected into the Lambda
# env so it needs no Secrets Manager call (and no interface VPC endpoint) at runtime.
data "aws_secretsmanager_secret_version" "db_master" {
  secret_id = module.rds.master_secret_arn
}
locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_master.secret_string)
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

  db_secret_arn     = module.rds.master_secret_arn
  db_host           = module.rds.address
  db_name           = module.rds.db_name
  db_user           = local.db_creds.username
  db_password       = local.db_creds.password
  media_bucket_arn  = module.storage.media_bucket_arn
  media_bucket_name = module.storage.media_bucket_name

  ai_mode            = var.ai_mode
  log_retention_days = var.log_retention_days
}
