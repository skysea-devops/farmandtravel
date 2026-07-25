terraform {
  backend "s3" {
    # Bucket is created by bootstrap/bootstrap-state.sh.
    # Replace <ACCOUNT_ID> with your 12-digit account id (the script prints it).
    bucket       = "farmandtravel-tfstate-<ACCOUNT_ID>"
    key          = "prod/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true # native S3 lock (Terraform >= 1.10); no DynamoDB table
  }
}
