output "account_id" {
  description = "The AWS account this state is deployed into."
  value       = data.aws_caller_identity.current.account_id
}

output "vpc_id" {
  value = module.network.vpc_id
}

output "private_subnet_ids" {
  value = module.network.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.network.public_subnet_ids
}

output "lambda_security_group_id" {
  value = module.network.lambda_sg_id
}

output "rds_security_group_id" {
  value = module.network.rds_sg_id
}

output "app_log_group_name" {
  value = module.observability.app_log_group_name
}
