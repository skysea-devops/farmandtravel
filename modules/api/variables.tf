variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }

variable "subnet_ids" {
  description = "Private subnet IDs for the Lambda VPC config."
  type        = list(string)
}
variable "security_group_ids" {
  description = "Lambda security group IDs (from network module)."
  type        = list(string)
}

# Cognito (JWT authorizer)
variable "cognito_issuer" { type = string }
variable "cognito_audiences" {
  description = "Allowed audiences = web + mobile app client IDs."
  type        = list(string)
}

# Data plane the Lambda touches
variable "db_secret_arn" { type = string }
variable "db_host" { type = string }
variable "db_name" { type = string }
variable "media_bucket_arn" { type = string }
variable "media_bucket_name" { type = string }

variable "ai_mode" {
  type    = string
  default = "bedrock"
}
variable "bedrock_model_id" {
  type    = string
  default = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "log_retention_days" {
  type    = number
  default = 14
}
