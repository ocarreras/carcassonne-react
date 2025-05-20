# Retrieve gitlab-user as a resource
resource "aws_iam_user" "github_user" {
    name = "github-user"

    tags = {
        terraform-managed = "True"
    }
}

resource "aws_iam_access_key" "github_user_key" {
    user = aws_iam_user.github_user.name
    
}


# Create the policy to access the S3 bucket
resource "aws_iam_policy" "ci_policy" {
  name        = "gitlab-ci-policy"
  path        = "/"
  description = "Gitlab CI policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ],
        Effect = "Allow",
        Resource = [
          "${aws_s3_bucket.static_react_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ListBucket"
        ],
        Effect = "Allow",
        Resource = [
          aws_s3_bucket.static_react_bucket.arn
        ]
      },
    ]
  })
}

# Attach the policy to our user
resource "aws_iam_policy_attachment" "gitlab_ci_attachment" {
  name       = "gitlab-ci-attachment"
  users      = [aws_iam_user.github_user.name]
  policy_arn = aws_iam_policy.ci_policy.arn
}