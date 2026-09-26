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

# CloudFront requires its ACM certificate in us-east-1, regardless of app region.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
