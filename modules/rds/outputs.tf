output "endpoint" {
  description = "DB endpoint host:port."
  value       = aws_db_instance.this.endpoint
}

output "address" {
  value = aws_db_instance.this.address
}

output "db_name" {
  value = aws_db_instance.this.db_name
}

# ARN of the RDS-managed master password secret (grant Lambda read access to this).
output "master_secret_arn" {
  value = aws_db_instance.this.master_user_secret[0].secret_arn
}
