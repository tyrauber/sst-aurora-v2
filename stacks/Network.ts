import { StackContext } from 'sst/constructs';
import { SecurityGroup, Vpc, Peer, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';

export function Network({ stack, app }: StackContext) {
  let vpc, sg;

  if(process.env.VPCID){
    vpc = Vpc.fromLookup(stack, 'VPC', {
      vpcId: process.env.VPCID,
    });
  }
  if(!(vpc)){
    vpc = new Vpc(stack, 'VPC', {
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
  }
  if(process.env.SGID){
    sg = SecurityGroup.fromSecurityGroupId(stack, 'SG', process.env.SGID);
  }
  if(!sg){
    sg = new SecurityGroup(stack, 'SG', {
      vpc,
      description: app.logicalPrefixedName('sg'),
      allowAllOutbound: true,
    });
    sg.addIngressRule(Peer.anyIpv4(), Port.tcp(5432));  
  }

  stack.addOutputs({
    VPCID: vpc.vpcId,
    SGID: sg.securityGroupId
  });

  return { vpc, sg };
}