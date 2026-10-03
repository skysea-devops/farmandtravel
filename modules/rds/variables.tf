variable "project" { type = string }
variable "environment" { type = string }

variable "subnet_ids" {
  description = "Private subnet IDs for the DB subnet group."
  type        = list(string)
}

variable "vpc_security_group_ids" {
  description = "Security groups (the RDS SG from the network module)."
  type        = list(string)
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "engine_version" {
  type    = string
  default = "16"
}

variable "db_name" {
  type    = string
  default = "farmandtravel"
}

variable "master_username" {
  type    = string
  default = "ftadmin"
}

# Stable master password, supplied by the caller (a Terraform-managed random_password).
# We do NOT use RDS-managed rotation: that rotates the password in Secrets Manager
# while the Lambdas carry a value injected at apply time, so a rotation silently
# breaks DB auth. A fixed password keeps RDS and the Lambda env in sync.
variable "master_password" {
  type      = string
  sensitive = true
}

variable "backup_retention_days" {
  type    = number
  default = 7
}
