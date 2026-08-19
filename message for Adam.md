Hi Adam!

Short version of what we need on AWS for igovazd.am. App is Next.js on Node, database is
MariaDB, and it handles user-uploaded photos, videos and PDFs.

## One thing to know first

The app currently writes uploaded files to local disk. We're fixing that as part of the move —
files go to S3, and the browser uploads to S3 directly via presigned URLs. That's why there's a
bucket and a CloudFront distribution in the list below, and why we don't need a big disk.

**No Lambda / Amplify / App Runner for the app itself.** Lambda needs a NAT Gateway to reach a
private database, which costs more than the compute it replaces. We're using Fargate.

## What to provision

Region: **eu-central-1 (Frankfurt)**.

**Compute**
- ECS Fargate, **exactly 1 task**, 0.5 vCPU / **2 GB**, in a **public subnet with a public IP**
  (the public subnet is deliberate — it avoids the NAT Gateway)
- **Autoscaling explicitly disabled.** The app keeps some state in process memory
  (login rate limits, a paid-API spend cap, page cache), so a second task would
  silently weaken all three. One task is a requirement, not a starting point.
- Application Load Balancer in front of it
- ECR repository for the image
- Same again for dev, on Fargate Spot

**Database**
- RDS **MariaDB** (not MySQL 8 — current production is MariaDB, so the dump restores as-is)
- `db.t4g.micro`, 20 GB, private subnet, public access disabled
- Automated backups, 7 days
- Two databases on that one instance: prod and dev, each with its own user

**Storage and CDN**
- S3 bucket `igovazd-uploads` — public access blocked, versioning on
- CloudFront distribution, access to the bucket via OAC, on `cdn.igovazd.am`
- Bucket CORS: allow `PUT` from `https://igovazd.am`

**Other**
- SES — domain verified, out of sandbox (the site sends email)
- Route 53 for DNS, ACM for certificates
- CloudWatch Logs with **14-day retention** (the default is "forever" and it quietly adds up)

**Security groups**
- ALB: 80 and 443 from anywhere
- RDS: 3306 only from the Fargate task security groups. Not open to the internet.

## What to send us

1. AWS account access, or an IAM user with permissions for ECS, ECR, RDS, S3, CloudFront,
   Lambda, SES, SSM and IAM
2. RDS endpoint, port, both database names, users and passwords
   ⚠️ No `#` `@` `/` `?` `:` in the passwords — they break the connection string.
   Letters, digits, hyphen and underscore only.
3. Bucket name and CloudFront domain
4. Confirmation that SES is out of sandbox
5. Who controls DNS for `igovazd.am`

Everything else — deploy pipeline, containers, migration of the existing data — we handle.

**Don't shut down Hostinger.** It stays live until AWS is verified and we switch DNS.

Rough cost: ~$62/month for production, ~$8 for dev.

Thanks!
