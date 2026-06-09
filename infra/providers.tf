# AWS provider. Credentials are NOT stored here — they live in ~/.aws/
# (outside the repo) under the named profile below. This file only
# references the profile *name*, which is safe to commit.
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Project   = "my-recipe-reels"
      ManagedBy = "OpenTofu"
    }
  }
}

data "aws_caller_identity" "current" {}
