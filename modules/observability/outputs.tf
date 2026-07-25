output "app_log_group_name" { value = aws_cloudwatch_log_group.app.name }
output "budget_name" { value = aws_budgets_budget.monthly.name }
