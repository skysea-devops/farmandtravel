locals {
  name = "${var.project}-${var.environment}"
}

# Shared application log group. Explicit retention so logs don't accumulate forever.
# Per-Lambda groups (/aws/lambda/<fn>) get created with their functions in Sprint 1,
# also with managed retention.
resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project}/${var.environment}/app"
  retention_in_days = var.log_retention_days

  tags = { Name = "${local.name}-app-logs" }
}

# Monthly cost budget with two alerts: actual > 80%, forecasted > 100%.
# Budgets is a global/account-level service; email subscribers need no SNS setup.
resource "aws_budgets_budget" "monthly" {
  name         = "${local.name}-monthly-cost"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_monthly_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
