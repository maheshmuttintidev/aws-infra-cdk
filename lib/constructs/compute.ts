import {
  AmazonLinuxImage,
  BlockDeviceVolume,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  keyName?: string; // Optional SSH key pair name
}

export class ComputeConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: ComputeConstructProps = {}) {
    super(scope, id);

    this.vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: SubnetType.PUBLIC },
        { name: 'private', subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    const sg = new SecurityGroup(this, 'InstanceSG', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'Security group for EC2 instance',
    });
    sg.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(22), 'SSH access from specific IP range');

    this.instance = new Instance(this, 'Instance', {
      vpc: this.vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage(),
      securityGroup: sg,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      keyName: props.keyName || process.env.EC2_KEY_NAME,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: BlockDeviceVolume.ebs(8, { encrypted: true }), // Use BlockDeviceVolume.ebs
        },
      ],
    });

    // Add metadata for instance ID
    this.instance.node.addMetadata('InstanceId', this.instance.instanceId);
  }
}
