project     = "farmandtravel"
environment = "prod"
aws_region  = "eu-central-1"

vpc_cidr = "10.20.0.0/16"
az_count = 2

log_retention_days       = 14
budget_monthly_limit_usd = 40
budget_alert_email       = "you@example.com" # <- SET THIS to your email
