
output "github_user_name" {
    value = aws_iam_user.github_user.name
}

output "github_user_access_key_id"  {
    description = "IAM Key ID"
    value = aws_iam_access_key.github_user_key.id
}

output "github_user_access_key_secret"  {
    description = "IAM Key secret"
    value = aws_iam_access_key.github_user_key.secret
    sensitive = true
}

output "cloudfront_domain_name" {
    description = "Cloudfront domain name"
    value = aws_cloudfront_distribution.cf_distribution.domain_name
}