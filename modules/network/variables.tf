variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }
variable "vpc_cidr" { type = string }
variable "az_count" { type = number }

variable "azs" {
  description = "List of AZ names to place subnets in (length must be >= az_count)."
  type        = list(string)
}
