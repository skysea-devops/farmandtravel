variable "project" { type = string }
variable "environment" { type = string }

variable "domain_name" {
  description = "Apex domain, e.g. topraklayeniden.com (www.<domain> is added automatically)."
  type        = string
}
