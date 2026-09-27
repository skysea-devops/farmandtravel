# Lambda (Hono lambdalith) + API Gateway HTTP API + Cognito JWT authorizer.
locals {
  name = "${var.project}-${var.environment}-api"
}

data "archive_file" "stub" {
  type        = "zip"
  source_dir  = "${path.module}/stub"
  output_path = "${path.module}/stub.zip"
}

# --- IAM ---
data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = local.name
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

# ENI management for VPC Lambda + CloudWatch Logs.
resource "aws_iam_role_policy_attachment" "vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "perms" {
  # Read the RDS-managed master password secret.
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.db_secret_arn]
  }
  # Media bucket read/write (presigned + server-side ops).
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${var.media_bucket_arn}/*"]
  }
  # Bedrock: tag inference.
  statement {
    actions   = ["bedrock:InvokeModel"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "perms" {
  name   = "${local.name}-perms"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.perms.json
}

# --- Lambda ---
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "api" {
  function_name = local.name
  role          = aws_iam_role.lambda.arn
  runtime       = "nodejs22.x"
  handler       = "main.handler"
  filename      = data.archive_file.stub.output_path
  memory_size   = 1536 # more memory = more CPU = faster cold start + queries
  timeout       = 15

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      NODE_ENV         = "production"
      AUTH_MODE        = "cognito"
      AI_MODE          = var.ai_mode
      BEDROCK_REGION   = var.aws_region
      BEDROCK_MODEL_ID = var.bedrock_model_id
      MEDIA_BUCKET     = var.media_bucket_name
      ALLOWED_ORIGINS  = join(",", var.allowed_origins)
      # DB creds injected at deploy time (no runtime Secrets Manager call / VPC endpoint).
      DB_SECRET_ARN = var.db_secret_arn
      DB_HOST       = var.db_host
      DB_NAME       = var.db_name
      DB_PORT       = "5432"
      DB_USER       = var.db_user
      DB_PASSWORD   = var.db_password
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  # Real code is shipped by CI; Terraform only owns the function's shape.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# --- API Gateway HTTP API ---
resource "aws_apigatewayv2_api" "http" {
  name          = local.name
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization", "x-dev-sub"]
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt"
  jwt_configuration {
    issuer   = var.cognito_issuer
    audience = var.cognito_audiences
  }
}

# Catch-all route → requires a valid Cognito JWT.
resource "aws_apigatewayv2_route" "default" {
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "$default"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

# Public routes (no auth): health, LS webhook, public taxonomy (teaser).
# OPTIONS /{proxy+} is public so CORS preflight bypasses the JWT authorizer that the
# $default route would otherwise apply (which makes the browser fail preflight).
locals {
  public_routes = [
    "GET /health",
    "POST /webhooks/lemonsqueezy",
    "GET /taxonomy",
    "GET /public/members",
    "OPTIONS /{proxy+}",
  ]
}
resource "aws_apigatewayv2_route" "public" {
  for_each  = toset(local.public_routes)
  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

# --- Keep the API Lambda warm (cuts VPC cold starts) ---
resource "aws_cloudwatch_event_rule" "warmup" {
  name                = "${local.name}-warmup"
  description         = "Ping the API Lambda to keep it warm"
  schedule_expression = "rate(2 minutes)"
}

resource "aws_cloudwatch_event_target" "warmup" {
  rule  = aws_cloudwatch_event_rule.warmup.name
  arn   = aws_lambda_function.api.arn
  input = jsonencode({ warmup = true })
}

resource "aws_lambda_permission" "warmup" {
  statement_id  = "AllowEventBridgeWarmup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.warmup.arn
}

# --- One-off DB migration runner ---
# Same code bundle, different handler (migrate.handler). Not wired to API Gateway;
# invoked on demand (CI or `aws lambda invoke`) to apply migrations + seed inside
# the VPC. Idempotent, so re-invoking is safe.
resource "aws_cloudwatch_log_group" "migrate" {
  name              = "/aws/lambda/${local.name}-migrate"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "migrate" {
  function_name = "${local.name}-migrate"
  role          = aws_iam_role.lambda.arn
  runtime       = "nodejs22.x"
  handler       = "migrate.handler"
  filename      = data.archive_file.stub.output_path
  memory_size   = 512
  timeout       = 120

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      NODE_ENV      = "production"
      DB_SECRET_ARN = var.db_secret_arn
      DB_HOST       = var.db_host
      DB_NAME       = var.db_name
      DB_PORT       = "5432"
      DB_USER       = var.db_user
      DB_PASSWORD   = var.db_password
    }
  }

  depends_on = [aws_cloudwatch_log_group.migrate]

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}
