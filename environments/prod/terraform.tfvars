project     = "farmandtravel"
environment = "prod"
aws_region  = "eu-central-1"

vpc_cidr = "10.20.0.0/16"
az_count = 2

log_retention_days       = 14
budget_monthly_limit_usd = 40
budget_alert_email       = "you@example.com" # <- SET THIS to your email

# Auth / app clients
cognito_domain_prefix = "topraklayeniden-prod" # must be globally unique
web_callback_urls     = ["http://localhost:5173", "http://localhost:5173/callback"]
web_logout_urls       = ["http://localhost:5173"]
mobile_callback_urls  = ["topraklayeniden://callback"]

# Tag inference: "bedrock" in prod, "stub" if Bedrock access not yet enabled
ai_mode = "bedrock"
