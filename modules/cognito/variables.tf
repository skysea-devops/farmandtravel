variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }

variable "callback_urls" {
  description = "Allowed OAuth callback URLs (web SPA + mobile deep links)."
  type        = list(string)
  default     = ["http://localhost:5173", "http://localhost:5173/callback"]
}

variable "logout_urls" {
  description = "Allowed OAuth logout URLs."
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "mobile_callback_urls" {
  description = "Mobile app deep-link callback URLs (custom scheme), e.g. topraklayeniden://callback."
  type        = list(string)
  default     = ["topraklayeniden://callback"]
}

variable "hosted_ui_domain_prefix" {
  description = "Globally-unique prefix for the Cognito Hosted UI domain."
  type        = string
}
