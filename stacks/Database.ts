import { StackContext, use } from 'sst/constructs';
import { Token } from 'aws-cdk-lib';
import * as AWS_RDS from "aws-cdk-lib/aws-rds";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from "aws-cdk-lib/aws-iam";

import { Network } from './Network';

export function Database({ stack, app }: StackContext) {
  const { sg, vpc } = use(Network);
  const rds = new AWS_RDS.DatabaseCluster(stack, "DB", {
    clusterIdentifier: `${app.name}-${app.stage}`,
    engine: AWS_RDS.DatabaseClusterEngine.auroraPostgres({
      version: AWS_RDS.AuroraPostgresEngineVersion.VER_15_2,
    }),
    instances: 1,
    instanceProps: {
        vpc,
        vpcSubnets: {
          subnetType: !!(app.local || process.env.PUBLIC_DB) ? ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE_ISOLATED
        },
        publiclyAccessible: !!(app.local || process.env.PUBLIC_DB),
        instanceType: "serverless" as any,
        autoMinorVersionUpgrade: true,
        securityGroups: [sg]
    },
  });
  (
    rds.node.findChild("Resource") as AWS_RDS.CfnDBCluster
  ).serverlessV2ScalingConfiguration = {
    minCapacity: 0.5,
    maxCapacity: 4,
  }

  const readSecretPolicy = new iam.PolicyStatement({
    actions: [
      "secretsmanager:GetResourcePolicy",
       "secretsmanager:GetSecretValue",
       "secretsmanager:DescribeSecret",
       "secretsmanager:ListSecretVersionIds" ],
    effect: iam.Effect.ALLOW,
    resources: [ rds.secret!.secretArn ],
  })

  app.addDefaultFunctionEnv({
    WRITER_ENDPOINT: Token.asString(rds.clusterEndpoint.hostname),
    READER_ENDPOINT: Token.asString(rds.clusterReadEndpoint.hostname),
    RDS_SECRET_ARN: rds.secret!.secretArn
  });

  app.setDefaultFunctionProps({
    vpc,
    vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS},
  })

  stack.addOutputs({
    writer: Token.asString(rds.clusterEndpoint.hostname),
    reader: Token.asString(rds.clusterReadEndpoint.hostname)
  });

  return { rds, policies: [readSecretPolicy] };
}
