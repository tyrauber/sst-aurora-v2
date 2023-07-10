import { StackContext, use } from 'sst/constructs';
import { Token } from 'aws-cdk-lib';
import * as AWS_RDS from "aws-cdk-lib/aws-rds";
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { Network } from './Network';

export function Database({ stack, app }: StackContext) {
  const net = use(Network);
  const rds = new AWS_RDS.DatabaseCluster(stack, "DB", {
    clusterIdentifier: `${app.name}-${app.stage}`,
    engine: AWS_RDS.DatabaseClusterEngine.auroraPostgres({
      version: AWS_RDS.AuroraPostgresEngineVersion.VER_14_4,
    }),
    instances: 1,
    instanceProps: {
      vpc: net.vpc,
      instanceType: "serverless" as any,
      autoMinorVersionUpgrade: true,
      publiclyAccessible: true,
      securityGroups: [net.sg],
      vpcSubnets: net.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC,
        /* Public for Local, Private for all other stages */
        //subnetType: app.local ?  ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE
      }),
    },
  });
  (
    rds.node.findChild("Resource") as AWS_RDS.CfnDBCluster
  ).serverlessV2ScalingConfiguration = {
    minCapacity: 0.5,
    maxCapacity: 4,
  }
 
  /* To-Do: The Lamaba should use Secrets Manager to get the credentials and construct the Database URL */
  const WRITER_URL = `postgres://${rds.secret?.secretValueFromJson('username')}:${rds.secret?.secretValueFromJson('password')}@${Token.asString(rds.clusterEndpoint.hostname)}:${rds.secret?.secretValueFromJson('port')}/postgres`;
  const READER_URL = `postgres://${rds.secret?.secretValueFromJson('username')}:${rds.secret?.secretValueFromJson('password')}@${Token.asString(rds.clusterReadEndpoint.hostname)}:${rds.secret?.secretValueFromJson('port')}/postgres`;

  rds.connections.allowFromAnyIpv4(ec2.Port.tcp(5432))
  app.addDefaultFunctionEnv({WRITER_URL, READER_URL});
  
  stack.addOutputs({
    writer: Token.asString(rds.clusterEndpoint.hostname),
    reader: Token.asString(rds.clusterReadEndpoint.hostname)
  });

  return rds
}
