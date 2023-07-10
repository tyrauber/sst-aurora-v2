# sst-aurora-v2
Serverless Stack (SST) Autora V2 RDS Postgres API

SST RDS construct does not currently support V2. This example demonstates a minimal implementation of Aurora V2 in SST using `aws-cdk-lib/aws-rds`.

**Note: Local SST dev mode does not work with VPC.** Therefore, to use RDS locally you must set the RDS instance to public, or utilize BastionHost or a VPN to connect to the private VPC.

## Stack

### /stacks/Network

```
import { StackContext } from 'sst/constructs';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';

export function Network({ stack, app }: StackContext) {
  const vpc = new Vpc(stack, app.logicalPrefixedName('net'), { natGateways: 1 });
  const sg = new SecurityGroup(stack, 'DefaultLambda', { vpc, description: 'Default security group' });
  app.setDefaultFunctionProps({ vpc, securityGroups: [sg] });
  sg.addEgressRule(Peer.anyIpv4(), Port.tcp(5432))
  return { vpc, sg };
}
```

### /stacks/Database
```
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
```

### Additional Notes:

With this configuration, the vpc.subnetType determines whether the database instance is publicly accessible:

```
  vpcSubnets: net.vpc.selectSubnets({
    subnetType: ec2.SubnetType.PUBLIC,
    /* Public for Local, Private for all other stages */
    //subnetType: app.local ?  ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE
  })
```
