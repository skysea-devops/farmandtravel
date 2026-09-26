variable "project" { type = string }
variable "environment" { type = string }

variable "cors_allowed_origins" {
  description = "Origins allowed to PUT via presigned URLs (web + mobile). Tighten to real domains in prod."
  type        = list(string)
  default     = ["*"]
}
