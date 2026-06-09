# Cognito User Pool for site visitor accounts (sign up / sign in to
# save, hide, and rate recipes). Email address is the username and is
# verified via a Cognito-sent confirmation code.
resource "aws_cognito_user_pool" "users" {
  name = "${var.project}-users"

  username_attributes     = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_uppercase = false
    require_numbers   = false
    require_symbols   = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your MyRecipeReels verification code"
    email_message        = "Your MyRecipeReels verification code is {####}"
  }
}

# Public app client for the React SPA. No client secret since the
# secret can't be kept private in browser-side code.
resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project}-web"
  user_pool_id = aws_cognito_user_pool.users.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "days"
    id_token      = "days"
    refresh_token = "days"
  }
}
