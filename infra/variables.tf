variable "aws_profile" {
  description = "Named AWS CLI profile (defined in ~/.aws/credentials) used for auth. Keeps creds out of the repo."
  type        = string
  default     = "dream-reel"
}

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name; used to name resources."
  type        = string
  default     = "my-recipe-reels"
}

variable "alert_email" {
  description = "Email for billing/cost alerts."
  type        = string
  default     = "dustin.bagwell@gmail.com"
}

variable "monthly_budget_usd" {
  description = "Monthly cost budget in USD."
  type        = string
  default     = "10"
}
