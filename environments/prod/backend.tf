terraform {
  backend "s3" {
    # Bucket is created by bootstrap/bootstrap-state.sh (prod account 191072269876).
    bucket       = "farmandtravel-tfstate-191072269876"
    key          = "prod/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true # native S3 lock (Terraform >= 1.10); no DynamoDB table
  }
}
