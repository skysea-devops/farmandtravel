variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }
variable "vpc_cidr" { type = string }
variable "az_count" { type = number }

variable "azs" {
  description = "List of AZ names to place subnets in (length must be >= az_count)."
  type        = list(string)
}

# When "bedrock", provision the bedrock-runtime interface endpoint (closed VPC needs it
# for AI calls). "stub" leaves it out to avoid the endpoint cost.
variable "ai_mode" {
  type    = string
  default = "stub"
}
