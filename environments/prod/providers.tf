provider "aws" {
  region = var.aws_region

  # Applied to every taggable resource, so modules don't repeat these.
  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
