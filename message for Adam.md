Hi Adam!

Rewriting this as one message — the earlier ones corrected each other twice as we measured
things, and you shouldn't have to reconstruct the truth from three versions. **This one
supersedes everything before it.** Where a number changed, I say why.

App is Next.js on Node, database is MariaDB, and it handles user-uploaded photos, videos and
PDFs. Region: **eu-central-1 (Frankfurt)**.

## What to provision

**Compute**
- ECS Fargate, **exactly 1 task**, 0.5 vCPU / **4 GB**, in a **public subnet with a public IP**
  — the public subnet is deliberate, it avoids the NAT Gateway
- **ARM64 / Graviton** on the task definition. Same task, about 20% cheaper: $19.57/month
  against $24.46. We've verified our image builds and runs on ARM64.
- **Autoscaling explicitly disabled.** The app keeps state in process memory (login rate
  limits, a paid-API spend cap, page cache), so a second task would silently weaken all
  three. One task is a requirement, not a starting point.
- Application Load Balancer in front of it, with the **idle timeout raised to ~900 seconds**
  (default is 60, range is 1–4000). Reason below.
- ECR repository for the image
- Same again for dev, on Fargate Spot. Spot is fine there and not for production — a
  reclaimed task with only one task running means the site is down.

> **Why 4 GB and not 2.** We measured what an upload actually costs: a 500 MB clip peaks at
> about 2.5 GB of RSS, roughly 4–5× the file, because the body is buffered and copied on its
> way through the app. That is more than a 2 GB task, from **one** upload — not two
> concurrent ones. We're moving video off the app entirely (see the CORS note below), and
> once that ships we can drop back to 2 GB. Until then 4 GB is about $8/month and it is the
> difference between a large upload being slow and a large upload taking the site down.

**Database**
- RDS **MariaDB** — not MySQL 8. Current production is MariaDB, so the dump restores as-is.
- `db.t4g.micro`, 20 GB, private subnet, public access disabled
- **Reserve it for 1 year.** No Upfront takes it from $13.87 to $9.20/month, 34% off. It runs
  24/7 either way, so there is nothing to lose by committing.
- Automated backups, 7 days
- Two databases on that one instance: prod and dev, each with its own user

**Storage and CDN**
- S3 bucket `igovazd-uploads` — public access blocked, versioning on
- CloudFront distribution, access to the bucket via OAC, on `cdn.igovazd.am`
- **Bucket CORS: allow `PUT` from `https://igovazd.am`** (and from the dev origin). The
  browser will upload video straight to the bucket — see below.
- ⚠️ **Keep CloudFront off the upload path.** It should serve files on `cdn.igovazd.am`; the
  site itself answers on the ALB. AWS doesn't document whether CloudFront buffers or streams
  a request body, and their own support guidance for large POST/PUT is to route around it.
  The layout above already does this — the thing to avoid is anyone later "simplifying" it by
  putting the whole site behind CloudFront.

**Other**
- **SES — please start this first.** Domain verified and production access requested. A new
  SES account starts in the sandbox, where mail only reaches verified addresses, and leaving
  it is a support request that takes days. If it's left until switch day, registration emails
  stop silently. It is the one item here with a queue on Amazon's side that we can't shorten.
- Route 53 for DNS, ACM for certificates
- CloudWatch Logs with **14-day retention**. The default is "forever" and it quietly adds up.
  Note this is set on the log group itself, not in the task definition.

**Security groups**
- ALB: 80 and 443 from anywhere
- RDS: 3306 only from the Fargate task security group. Not open to the internet.

## Why not Lambda or App Runner

You asked about App Runner, on the grounds that traffic is low and there are no visitors at
night. That's the right instinct in general. It doesn't work here, and the decisive reason
isn't cost.

**The 120-second wall.** App Runner has a hard limit of 120 seconds on a single HTTP request,
covering everything from reading the request body to writing the response. Not a default —
not configurable. We accept uncapped video uploads because clients send whatever their phone
shot, and a 4K clip on a mobile connection is a request lasting many minutes. Every one of
those would be cut off. Lambda fails for a different reason: a synchronous invocation caps
the *request* at 6 MB, so it can't accept a video at all.

The cost case doesn't hold either:

- **App Runner does not scale to zero.** Minimum instance count is 1 and cannot be 0. Idle
  instances still bill provisioned memory — $0.008176/GB-hour here, so a 2 GB service with
  zero traffic is $11.94/month just to exist.
- **The VPC connector brings back the NAT Gateway.** Reaching RDS in a private subnet needs
  one, and AWS documents that once attached, *all* outbound traffic goes through the VPC with
  no split tunnel. Our app calls Google OAuth, the GitHub API, a web-push service and SES,
  none with a usable PrivateLink endpoint. That's $37.96/month before data — the exact cost
  the public-subnet Fargate task exists to avoid.
- **Aurora Serverless v2**, for completeness: it genuinely reaches 0 ACU now, but it's
  MySQL/PostgreSQL-compatible only — **not MariaDB**, so it's an engine migration rather than
  a hosting change — and its 0.5 ACU floor is $51.10/month against $13.87 for the
  `db.t4g.micro` above. Scaling to zero doesn't help when the floor above zero is four times
  the price.

The real savings with no architectural risk are the two already in the list: ARM64 and the
reserved database instance, together about $10/month.

## Two things that need explaining, not just listing

**The ALB idle timeout.** It's *inactivity*-based, not total duration, so a long upload is
safe while bytes keep arriving. The danger is the quiet stretch **after** the body lands,
while the app writes the file out and re-encodes the image — nothing flows on the connection
then, and on a large file it can outlast the 60-second default. AWS also notes the app's own
idle timeout must sit *above* the load balancer's or you get intermittent 502s; that half is
on us and it's done.

**Video uploads bypass the app.** The browser asks our server for a presigned URL and PUTs the
clip straight to the bucket. That's why the CORS rule is there. Images still go through the
app — they're capped at 8 MB and have to be re-encoded server-side anyway. If you saw an
earlier message telling you to scratch the CORS rule: that was written before we measured the
memory cost, and it's wrong.

## What to send us

1. AWS account access, or an IAM user with permissions for ECS, ECR, RDS, S3, CloudFront,
   SES, SSM and IAM
2. RDS endpoint, port, both database names, users and passwords
   ⚠️ No `#` `@` `/` `?` `:` in the passwords — they break the connection string. Letters,
   digits, hyphen and underscore only.
3. Bucket name and CloudFront domain
4. The account id and region for the SSM parameter ARNs (we have the task definitions written
   and checked into the repo, with the account id as the only placeholder left)
5. Confirmation that SES is out of sandbox
6. Who controls DNS for `igovazd.am`

Everything else — deploy pipeline, containers, migration of the existing data — we handle.

**Don't shut down Hostinger.** It stays live until AWS is verified and we switch DNS, and
stays paid but out of traffic for a week after that, so a rollback is a DNS change rather
than a restore.

Rough cost: ~$70/month for production at 4 GB, dropping to ~$62 once uploads move off the
app; ~$8 for dev.

Thanks!
