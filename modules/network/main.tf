locals {
  name = "${var.project}-${var.environment}"
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true # needed for interface VPC endpoints (SES, SSM, ...) later

  tags = { Name = "${local.name}-vpc" }
}

# Private subnets across az_count AZs. Lambda ENIs + RDS live here.
# Two AZs even for a Single-AZ RDS: a DB subnet group must span >= 2 AZs (AWS rule).
# No internet route anywhere in this VPC — it is closed. AWS access is via VPC endpoints.
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.this.id
  availability_zone = var.azs[count.index]
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)

  tags = {
    Name = "${local.name}-private-${var.azs[count.index]}"
    Tier = "private"
  }
}

# Private route table: implicit local route + the S3 gateway endpoint's prefix-list
# route only. No IGW, no NAT -> no path to the internet.
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.name}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# S3 Gateway Endpoint (free). Lets in-VPC Lambda reach S3 without a NAT gateway.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = { Name = "${local.name}-s3-gwe" }
}

# --- Security groups (attached to Lambda/RDS in Sprint 1) ---------------------
resource "aws_security_group" "lambda" {
  name        = "${local.name}-lambda-sg"
  description = "Lambda ENIs in private subnets"
  vpc_id      = aws_vpc.this.id

  egress {
    description = "All outbound (RDS, VPC endpoints, AWS APIs)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-lambda-sg" }
}

resource "aws_security_group" "rds" {
  name        = "${local.name}-rds-sg"
  description = "RDS Postgres - Postgres port from the Lambda SG only"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "Postgres from Lambda"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = { Name = "${local.name}-rds-sg" }
}

# --- Bedrock interface endpoint (AI_MODE=bedrock) ----------------------------
# Closed VPC has no internet egress, so the Lambda reaches the Bedrock runtime API
# over a private interface endpoint (no NAT needed). ~$0.011/hr per AZ.
resource "aws_security_group" "vpce" {
  count       = var.ai_mode == "bedrock" ? 1 : 0
  name        = "${local.name}-vpce-sg"
  description = "HTTPS from Lambda to interface VPC endpoints"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "HTTPS from Lambda"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = { Name = "${local.name}-vpce-sg" }
}

resource "aws_vpc_endpoint" "bedrock_runtime" {
  count               = var.ai_mode == "bedrock" ? 1 : 0
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.bedrock-runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpce[0].id]
  private_dns_enabled = true

  tags = { Name = "${local.name}-bedrock-runtime-vpce" }
}
