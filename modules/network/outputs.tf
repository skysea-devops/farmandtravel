output "vpc_id" { value = aws_vpc.this.id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }
output "private_route_table_id" { value = aws_route_table.private.id }
output "lambda_sg_id" { value = aws_security_group.lambda.id }
output "rds_sg_id" { value = aws_security_group.rds.id }
