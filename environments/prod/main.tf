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
