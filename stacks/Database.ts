import { StackContext, use } from 'sst/constructs';
import { Token } from 'aws-cdk-lib';
import * as AWS_RDS from "aws-cdk-lib/aws-rds";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from "aws-cdk-lib/aws-iam";

import { Network } from './Network';

export function Database({ stack, app }: StackContext) {
  let rds;
  const { sg, vpc } = use(Network);
  const identifier = process.env.RDSID ? process.env.RDSID : `${app.name}-${app.stage}`;
  rds = AWS_RDS.DatabaseCluster.fromDatabaseClusterAttributes(stack, "DB", {
    cluster_identifier: identifier
  });

  if(!rds?.clusterIdentifier){
    rds = new AWS_RDS.DatabaseCluster(this, 'Database', {
      clusterIdentifier: identifier,
      engine: AWS_RDS.DatabaseClusterEngine.auroraPostgres({
        version: AWS_RDS.AuroraPostgresEngineVersion.VER_15_2 
      }),
      writer: AWS_RDS.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: !!(app.local || process.env.PUBLIC_DB),
      }),
      // readers: [
      //   AWS_RDS.ClusterInstance.serverlessV2('reader'),
      // ],
      vpcSubnets: {
        subnetType: !!(app.local || process.env.PUBLIC_DB) ? ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE_ISOLATED
      },
      vpc,
      securityGroups: [sg],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
    });
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
    RDSID: rds.clusterIdentifier,
    WRITER: Token.asString(rds.clusterEndpoint.hostname),
    READER: Token.asString(rds.clusterReadEndpoint.hostname)
  });

  return { rds, policies: [readSecretPolicy] };
}
