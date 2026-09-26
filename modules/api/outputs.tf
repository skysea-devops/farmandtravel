output "api_endpoint" {
  description = "Public HTTPS endpoint of the HTTP API."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "lambda_function_name" {
  value = aws_lambda_function.api.function_name
}

output "migrate_function_name" {
  value = aws_lambda_function.migrate.function_name
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda.arn
}
