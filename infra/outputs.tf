output "bucket_name" {
  description = "S3 bucket holding the built site."
  value       = aws_s3_bucket.site.bucket
}

output "site_url" {
  description = "Public site URL (HTTP)."
  value       = "http://${aws_s3_bucket_website_configuration.site.website_endpoint}"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID for visitor accounts."
  value       = aws_cognito_user_pool.users.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito App Client ID used by the frontend."
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID used to grant signed-in users DynamoDB access."
  value       = aws_cognito_identity_pool.main.id
}

output "user_data_table_name" {
  description = "DynamoDB table storing per-user saved/hidden/rated recipes."
  value       = aws_dynamodb_table.user_data.name
}
