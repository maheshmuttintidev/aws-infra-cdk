import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AwsInfraCdkStack } from '../lib/aws-infra-cdk-stack';

describe('AwsInfraCdkStack', () => {
  let app: App;
  let stack: AwsInfraCdkStack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new AwsInfraCdkStack(app, 'TestStack', {
      domainName: 'example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc123',
      ec2KeyName: 'my-key-pair',
      alarmTopicArn: 'arn:aws:sns:us-east-1:123456789012:my-alarm-topic',
    });
    template = Template.fromStack(stack);
  });

  test('creates EC2 instance with expected properties', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
      KeyName: 'my-key-pair',
      BlockDeviceMappings: Match.arrayWith([
        Match.objectLike({
          DeviceName: '/dev/xvda',
          Ebs: { VolumeSize: 8, Encrypted: true },
        }),
      ]),
    });
  });

  test('creates Security Group with SSH ingress rule', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '0.0.0.0/0',
          Description: 'SSH access from specific IP range',
        }),
      ]),
    });
  });

  test('creates S3 bucket with versioning and encryption', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          Match.objectLike({
            ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
          }),
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('creates Cognito User Pool with email sign-in', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameConfiguration: { CaseSensitive: false },
      AutoVerifiedAttributes: ['email'],
      Schema: Match.arrayWith([Match.objectLike({ Name: 'email', Required: true })]),
    });
  });

  test('creates Route 53 hosted zone and A record', () => {
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'example.com.',
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api.example.com.',
      Type: 'A',
      TTL: '300',
    });
  });

  test('creates CloudWatch alarm for EC2 CPU utilization', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/EC2',
      Statistic: 'Average',
      Period: 300,
      Threshold: 10,
      ComparisonOperator: 'LessThanThreshold',
      EvaluationPeriods: 2,
    });
  });

  test('creates Application Load Balancer', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Type: 'application',
      Scheme: 'internet-facing',
      IpAddressType: 'ipv4',
    });
  });

  test('creates SNS topic for alarms', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'Infrastructure Alarms',
    });
  });
});
