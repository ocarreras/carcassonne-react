/**
 * The ACM certificate needs to be created on us-east-1 to be usable 
 * with cloudfront (aws restriction.).
 */
provider "aws" {
  alias = "virginia"
  region = "us-east-1"
}

resource "aws_acm_certificate" "cert" {
  provider          = aws.virginia

  domain_name       = var.domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

// Certificate Validation
resource "aws_acm_certificate_validation" "cert" {
  provider = aws.virginia
  
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validations : record.fqdn]
}

data "aws_route53_zone" "zone" {
  name         = var.route53_zone
  private_zone = false
}

resource "aws_route53_record" "cert_validations" {
  zone_id         = data.aws_route53_zone.zone.zone_id

  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
}

resource "aws_route53_record" "record_a" {
  zone_id = data.aws_route53_zone.zone.id
  name    = var.domain
  type    = "A"

  alias {
    name                   = replace(aws_cloudfront_distribution.cf_distribution.domain_name, "/[.]$/", "")
    zone_id                = aws_cloudfront_distribution.cf_distribution.hosted_zone_id
    evaluate_target_health = true
  }
}