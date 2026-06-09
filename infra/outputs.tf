output "bucket_name" {
  description = "S3 bucket holding the built site."
  value       = aws_s3_bucket.site.bucket
}

output "site_url" {
  description = "Public site URL (HTTP)."
  value       = "http://${aws_s3_bucket_website_configuration.site.website_endpoint}"
}
