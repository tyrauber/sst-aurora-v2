import { StackContext } from 'sst/constructs';
import { SecurityGroup, Vpc, Peer, Port } from 'aws-cdk-lib/aws-ec2';

export function Network({ stack, app }: StackContext) {
  const vpc = new Vpc(stack, app.logicalPrefixedName('net'), { natGateways: 1 });
  const sg = new SecurityGroup(stack, 'DefaultLambda', { vpc, description: 'Default security group' });
  app.setDefaultFunctionProps({ vpc, securityGroups: [sg] });
  sg.addEgressRule(Peer.anyIpv4(), Port.tcp(5432))
  return { vpc, sg };
}