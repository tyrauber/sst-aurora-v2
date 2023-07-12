# sst-aurora-v2
Serverless Stack (SST) Autora V2 RDS Postgres API

SST RDS construct does not currently support V2. This example demonstates a minimal implementation of Aurora V2 in SST using `aws-cdk-lib/aws-rds`.

This implementation is optimized for security and performance, using a private RDS instance, VPC and Subnet, and [Postgres.js](https://github.com/porsager/postgres) for quick SQL queries.

Roundtrip from an ec2 instance, in the same region (us-east-1), to the lambda, to RDS, and back, takes roughly 150ms with a simple `SELECT version()`.

``````
[ec2-user@ip ~]$ curl -o /dev/null -s -w 'Total: %{time_total}s\n'  https://x.execute-api.us-east-1.amazonaws.com
Total: 0.132562s
``````

## Usage:

1. Clone: `git clone github.com/tyrauber/sst-aurora-v2`
2. Insall Dependencies: `pnpm install`
3. Run `pnpm run dev` or `pnpm run deploy --stage dev`

Note: It will take upwards of 10 minutes to build and deploy the stack.

## Security

This architecture defaults to a private RDS instance, unless `app.local` or `process.env.PUBLIC_DB` is set to true. If either of these conditions are true, the Databse Stack sets `publiclyAccessible` to true, and the `vpcSubnets.subnetType` to `ec2.SubnetType.PUBLIC`. Once deployed, these conditions cannot be changed.

It is worth noting, setting the RDS instance to public DOES NOT negatively impact performance. Response times are similar to above under the same conditions, suggesting the API uses the private VPC to connect to the RDS instance, even when the instance is set to public!

## Architecture:

- / stacks
  - / [API.ts](stacks/API.ts)
  - / [Database.ts](stacks/Database.ts)
  - / [Network.ts](stacks/Network.ts)
- / packages
  - functions/src
    - [status.ts](packages/functions/src/status.ts)
  - core/src
    - [database.ts](packages/core/src/database.ts)

## To-Do:

- [ ] Make VPC, SecurityGroup and RDS instance shareable between stacks
- [ ] Add BastionHost, for SSH access
- [ ] IAM RDS Access
- [ ] Add database migrations

## Documentation

- [SST Docs](https://docs.sst.dev/)
- [Aurora Serverless v2 #2506](https://github.com/serverless-stack/sst/issues/2506)
- [lefnire's Aurora V2 gist](https://gist.github.com/lefnire/dff175eabdcaec8fdf15c6acfb5bd3e1)
- [jetbridge/sst-prisma](https://github.com/jetbridge/sst-prisma)

## Special Thanks

Special thanks to @lefnire for the Aurora V2 gist.