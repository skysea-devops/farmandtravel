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

# Tag inference: "bedrock" in prod, "stub" if Bedrock access not yet enabled.
# Kept "stub" for launch: onboarding works without Bedrock model access or the
# extra interface-endpoint cost. Flip to "bedrock" once model access is granted
# (that also turns on the bedrock-runtime VPC endpoint automatically).
ai_mode = "bedrock"
# Haiku 4.5 via the EU cross-region inference profile. Verify the exact id in the
# Bedrock console (Inference profiles) and grant model access before relying on it.
bedrock_model_id = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"

# Paywall: free "frontier" until this date. Kept far out until Lemon Squeezy is live;
# set to the real launch date (e.g. 2026-10-15T00:00:00+03:00) to start requiring pay.
# NOTE: only pull this forward once LS checkout is live, otherwise new members land on
# a paywall with no way to pay.
frontier_cutoff = "2027-01-01T00:00:00+03:00"

# RDS ölçekleme — büyüdükçe çevir (kod değişmeden):
#   büyüme → rds_instance_class = "db.t4g.small" / "db.t4g.medium"
#   üretim dayanıklılığı → rds_multi_az = true (instance maliyetini ~2'ye katlar)
rds_instance_class = "db.t4g.micro"
rds_multi_az       = false

# Frontend public domain (Route 53 hosted zone already in this account)
domain_name = "topraklayeniden.com"

# İkinci apex domain — İngilizce pazar (reconnectwithsoil.com). Route53 hosted
# zone'u bu hesapta zaten kayıtlı. Aynı CloudFront dağıtımı + ACM sertifikası
# apex + www olarak her iki domaini sunar; hostname diline göre site İngilizce açılır.
secondary_domain = "reconnectwithsoil.com"
