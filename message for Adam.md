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
- ECS Fargate, **exactly 1 task**, 0.5 vCPU / **4 GB** (see the last section — this was 2 GB
  until we measured what an upload costs), in a **public subnet with a public IP**
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

---

# Follow-up: App Runner and serverless

You're right that for a site with low traffic and no visitors at night, serverless is normally
the cheaper shape. I checked it properly against the AWS docs rather than guessing, and it
doesn't work here — for one reason that has nothing to do with price.

## 1. The 120-second wall

App Runner has a **hard 120-second limit on a single HTTP request**, covering everything from
reading the request body to writing the response. It is not a default. It is not configurable.

We accept **uncapped video uploads**. The site owner removed the size cap deliberately: clients
send whatever their phone shot, and a 4K clip is hundreds of megabytes. On an Armenian mobile
connection that is a request lasting **many minutes**. Every one of those uploads would be cut
off at 120 seconds.

Same story on Lambda, for a different reason: a synchronous invocation — including a function
URL and API Gateway proxy — caps the **request** at **6 MB**. Response streaming raises the
response side to 200 MB and leaves the request side at 6 MB. So Lambda cannot accept a video at
all.

That alone settles it. Everything below is why it wouldn't have saved money either.

## 2. App Runner does not scale to zero

Minimum instance count defaults to 1 and **cannot be set to 0**. Idle instances still bill
provisioned memory — vCPU is what stops being billed, not memory.

In eu-central-1 that is $0.008176/GB-hour. A 2 GB service, zero requests, all month:
**$11.94/month just to exist.**

## 3. The VPC connector pulls in the NAT Gateway anyway

Reaching RDS in a private subnet needs a VPC connector. The AWS docs are explicit that once one
is attached, **all** outbound traffic is forced through the VPC — there is no split tunnel:

> "When you connect your service to a VPC, the outbound traffic doesn't have access to the
> public internet... your services can't access the public internet and AWS APIs."

Our app makes outbound calls to Google OAuth, the GitHub API (the in-admin translation editor
publishes through it), a web-push service and an email service. None of those has a PrivateLink
endpoint we could substitute. So App Runner would need a NAT Gateway — **$37.96/month before
data** in eu-central-1 — which is the exact cost the public-subnet Fargate task was chosen to
avoid.

Add it up: $11.94 idle memory + active CPU + $37.96 NAT + $13.87 RDS is **more** than the
Fargate design, and it still can't take an upload.

## 4. Aurora Serverless v2, for completeness

It genuinely does scale to 0 ACU now. Two problems: Aurora is MySQL- and PostgreSQL-compatible
only, **not MariaDB**, so it would be an engine migration rather than a hosting change; and at
0.5 ACU it costs $51.10/month against $13.87 for the `db.t4g.micro` we asked for. Scaling to
zero doesn't help when the floor above zero is four times the price.

## What actually cuts the bill

Two changes, no architectural risk, roughly **$10/month saved**:

**a. Run Fargate on ARM64 (Graviton) instead of x86.** Same task, ~20% cheaper on both
dimensions: $19.57/month instead of $24.46 for 0.5 vCPU / 2 GB. Set the task definition's
runtime platform to ARM64 — we'll build the image for that architecture on our side.

**b. Reserve the RDS instance for 1 year.** No Upfront takes db.t4g.micro from $13.87 to
**$9.20/month** (34% off). All Upfront is $104/year, about $8.67/month. The database runs 24/7
either way, so there is nothing to lose by committing.

Not recommending Fargate Spot for production — "up to 70% off" is real, but a reclaimed task
with only one task running means the site goes down. Spot is fine for the dev environment,
which is what the original list already says.

Compute Savings Plans would stack on top of (a). AWS only publishes an "up to 72%" ceiling
across EC2 + Fargate + Lambda combined and no Fargate-specific rate, so I'm not going to quote
you a number — worth checking in the console once the account exists and usage is real.

## Two corrections to the list above

1. **Scratch the presigned-URL sentence.** As built, uploads go through the app and the app
   writes to S3 — the browser does not PUT to the bucket directly. So the bucket CORS rule
   isn't needed. Everything else about the bucket and CloudFront stands.

2. Because uploads pass through the app, please **raise the ALB idle timeout** — default is 60
   seconds, the range is 1–4000. Set it to something like 900.

   To be precise about why, since it's not what it first looks like: the ALB timeout is
   *inactivity*-based, not total duration, so the upload itself is safe — bytes keep arriving
   the whole time. The danger is the quiet stretch **after** the body has fully arrived, while
   the app writes the file out to S3 and re-encodes the image. Nothing flows on the connection
   during that, and on a large clip it can outlast 60 seconds. AWS's own note on this is to
   also keep the app's own idle timeout *above* the ALB's, or you get intermittent 502s — that
   part is on us, and we'll handle it.

   Also please keep **CloudFront out of the upload path**: it should sit in front of
   `cdn.igovazd.am` for serving files, while the site itself answers on the ALB. AWS doesn't
   document whether CloudFront buffers or streams a request body, and their own support
   guidance for large POST/PUT is to route around it. The original list is already built this
   way — just don't let anyone "simplify" it later by putting the whole site behind CloudFront.

## What this doesn't change

Nothing in the provisioning list except the two corrections above. Fargate, one task,
autoscaling off, public subnet, ALB, RDS MariaDB, S3 + CloudFront — all as originally
requested, with ARM64 on the task and a 1-year reservation on the database.

---

# One more, and it partly reverses the last message

Sorry for the churn — this one came out of a measurement, and it changes an answer I gave
you an hour ago. Better now than on provisioning day.

We measured what an upload actually costs the app in memory. A 500 MB clip peaks at about
**2.5 GB of RSS** — four to five times the file, because the body is buffered and copied
on its way through. That is more than the whole 2 GB task, from **one** upload. Not two
concurrent ones. One phone.

So the owner has decided to move video uploads **off the app entirely**: the browser will
PUT the clip straight to the bucket with a presigned URL, and the app never touches the
bytes. Images keep going through the app — they are capped at 8 MB and have to be
re-encoded server-side anyway.

Two consequences for your side:

1. **The bucket CORS rule is back on.** The previous message told you to scratch it. Please
   put it back: allow `PUT` from `https://igovazd.am` (and from the dev origin for the dev
   bucket prefix). That message was written on the assumption uploads would keep flowing
   through the app; that assumption is what the measurement killed.

2. **Please make the task 4 GB, not 2.** Direct-to-bucket uploads take a few days to build,
   and until they ship every upload still goes through the app with the memory profile
   above. 4 GB is roughly $8/month more and it is the difference between a large upload
   being slow and a large upload taking the site down. Once presigned uploads are live we
   can drop it back to 2 GB and take that money back.

Everything else stands.
