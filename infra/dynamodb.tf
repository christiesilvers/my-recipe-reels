# Per-user "cookbook" data — saved recipes, hidden reels, and ratings —
# so signed-in users see the same lists on any device. One item per user,
# keyed by their Cognito identity (sub).
resource "aws_dynamodb_table" "user_data" {
  name         = "${var.project}-user-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}

# Identity Pool lets signed-in Cognito users get short-lived AWS
# credentials directly in the browser — no servers/APIs needed.
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name              = "${var.project} identity pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.web.id
    provider_name           = aws_cognito_user_pool.users.endpoint
    server_side_token_check = false
  }
}

data "aws_iam_policy_document" "authenticated_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.main.id]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "authenticated" {
  name               = "${var.project}-cognito-authenticated"
  assume_role_policy = data.aws_iam_policy_document.authenticated_assume.json
}

# Each signed-in user can only read/write the single DynamoDB item whose
# primary key matches their own Cognito identity ID.
data "aws_iam_policy_document" "authenticated_dynamodb" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
    ]
    resources = [aws_dynamodb_table.user_data.arn]

    condition {
      test     = "ForAllValues:StringEquals"
      variable = "dynamodb:LeadingKeys"
      values   = ["$${cognito-identity.amazonaws.com:sub}"]
    }
  }
}

resource "aws_iam_role_policy" "authenticated_dynamodb" {
  name   = "${var.project}-authenticated-dynamodb"
  role   = aws_iam_role.authenticated.id
  policy = data.aws_iam_policy_document.authenticated_dynamodb.json
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated = aws_iam_role.authenticated.arn
  }
}
