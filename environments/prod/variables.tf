variable "project" {
  description = "Short project slug used in resource names and tags."
  type        = string
  default     = "farmandtravel"
}

variable "environment" {
  description = "Deployment environment (prod, dev, ...). Kept parametric so a dev env is nearly free to add later."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for all regional resources."
  type        = string
  default     = "eu-central-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "Number of Availability Zones to spread subnets across."
  type        = number
  default     = 2
}

variable "log_retention_days" {
  description = "Default CloudWatch Logs retention (days). Guards against silent log-storage cost creep."
  type        = number
  default     = 14
}

variable "budget_monthly_limit_usd" {
  description = "Monthly cost budget threshold (USD) for the alert."
  type        = number
  default     = 40
}

variable "budget_alert_email" {
  description = "Email address that receives budget alerts. No default: must be set in terraform.tfvars."
  type        = string
}

variable "cognito_domain_prefix" {
  description = "Globally-unique Cognito Hosted UI domain prefix."
  type        = string
  default     = "topraklayeniden-prod"
}

variable "web_callback_urls" {
  description = "Web SPA OAuth callback URLs."
  type        = list(string)
  default     = ["http://localhost:5173", "http://localhost:5173/callback"]
}

variable "web_logout_urls" {
  description = "Web SPA OAuth logout URLs."
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "mobile_callback_urls" {
  description = "Mobile app deep-link OAuth callback URLs."
  type        = list(string)
  default     = ["topraklayeniden://callback"]
}

variable "ai_mode" {
  description = "Tag inference mode: bedrock (prod) or stub."
  type        = string
  default     = "bedrock"
}

variable "domain_name" {
  description = "Public apex domain for the frontend."
  type        = string
  default     = "topraklayeniden.com"
}

variable "secondary_domain" {
  description = "Second apex domain served by the same site (English market). Its Route53 zone must exist in this account. Set to reconnectwithsoil.com to enable; empty keeps a single domain so a missing zone can't block deploys."
  type        = string
  default     = ""
}

# --- Lemon Squeezy billing (set via tfvars / CI secret when ready; empty disables checkout) ---
variable "ls_store" {
  description = "Lemon Squeezy store subdomain (e.g. 'toprakla')."
  type        = string
  default     = ""
}
variable "ls_variant_tr" {
  description = "LS variant id for the $20/yr Toprak plan."
  type        = string
  default     = ""
}
variable "ls_variant_intl" {
  description = "LS variant id for the $40/yr Return plan."
  type        = string
  default     = ""
}
variable "ls_webhook_secret" {
  description = "LS webhook signing secret."
  type        = string
  default     = ""
  sensitive   = true
}
