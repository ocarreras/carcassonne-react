terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.33.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

terraform {
  backend "s3" {
    region         = "eu-central-1"
    bucket         = "strcat-terraform-state-backend"
    dynamodb_table = "strcat-terraform-lock"
    key            = "carcassonne-react.tfstate"
  }
}

variable domain {
  type        = string
  default     = "carcassonne.str.cat"
  description = "The domain where to deploy the app."
}

variable route53_zone {
  type        = string
  default     = "str.cat"
  description = "The main route53 domain name where to add the app."
}

variable s3_bucket_name {
  type        = string
  default     = "carcassonne-react"
  description = "S3 bucket where the app will be deployed"
}

resource "aws_s3_bucket" "static_react_bucket" {
  bucket = var.s3_bucket_name

}

resource "aws_s3_bucket_versioning" "static_react_versioning" {
  bucket = aws_s3_bucket.static_react_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}


resource "aws_s3_bucket_public_access_block" "static_react_block_public_access" {
  bucket = aws_s3_bucket.static_react_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "static_react_s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.static_react_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "react_app_bucket_policy" {
  bucket = aws_s3_bucket.static_react_bucket.id
  policy = data.aws_iam_policy_document.static_react_s3_policy.json
}