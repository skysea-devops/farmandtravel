variable "project" { type = string }
variable "environment" { type = string }

variable "domain_name" {
  description = "Apex domain, e.g. topraklayeniden.com (www.<domain> is added automatically)."
  type        = string
}

variable "secondary_domain" {
  description = "Optional second apex domain (e.g. reconnectwithsoil.com) served by the same distribution. Its Route53 zone must exist. Empty = single domain."
  type        = string
  default     = ""
}
