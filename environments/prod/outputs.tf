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

output "lambda_security_group_id" {
  value = module.network.lambda_sg_id
}

output "rds_security_group_id" {
  value = module.network.rds_sg_id
}

output "app_log_group_name" {
  value = module.observability.app_log_group_name
}

# --- Auth ---
output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}
output "cognito_web_client_id" {
  value = module.cognito.web_client_id
}
output "cognito_mobile_client_id" {
  value = module.cognito.mobile_client_id
}
output "cognito_hosted_ui_domain" {
  value = module.cognito.hosted_ui_domain
}

# --- Data / compute ---
output "rds_endpoint" {
  value = module.rds.endpoint
}
output "media_bucket_name" {
  value = module.storage.media_bucket_name
}
output "api_endpoint" {
  value = module.api.api_endpoint
}
output "lambda_function_name" {
  value = module.api.lambda_function_name
}
output "migrate_function_name" {
  value = module.api.migrate_function_name
}

# --- Frontend hosting ---
output "site_url" {
  value = module.site.url
}
output "site_bucket" {
  value = module.site.bucket_name
}
output "cloudfront_distribution_id" {
  value = module.site.distribution_id
}
output "cloudfront_domain" {
  value = module.site.distribution_domain
}
