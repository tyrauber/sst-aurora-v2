import { StackContext } from 'sst/constructs';
import { SecurityGroup, Vpc, Peer, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';

export function Network({ stack, app }: StackContext) {
  const vpc = new Vpc(stack, 'VPC', {
    natGateways: 1,
    maxAzs: 2,
    // enableDnsSupport: true,
    // enableDnsHostnames: true,
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'Private',
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      {
        cidrMask: 24,
        name: 'PrivateWithEgress',
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      {
        cidrMask: 24,
        name: 'Public',
        subnetType: SubnetType.PUBLIC,
      },
    ]
  })
  const sg = new SecurityGroup(stack, 'SG', {
    vpc,
    description: app.logicalPrefixedName('sg'),
    allowAllOutbound: true,
  });
  sg.addIngressRule(Peer.anyIpv4(), Port.tcp(5432));
  return { vpc, sg };
}