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
