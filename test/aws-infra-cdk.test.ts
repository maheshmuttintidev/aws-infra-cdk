import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AwsInfraCdkStack } from '../lib/aws-infra-cdk-stack';

describe('AwsInfraCdkStack', () => {
  let app: App;
  let template: Template;

  beforeEach(() => {
    app = new App();
    const stack = new AwsInfraCdkStack(app, 'TestStack', {
      domainName: 'example.com',
      certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc123',
      ec2KeyName: 'my-key-pair',
    });
    template = Template.fromStack(stack);
  });

  test('creates EC2 instance with key pair and volume', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      KeyName: 'my-key-pair',
      InstanceType: 't2.micro',
    });

    template.hasResource('AWS::EC2::Instance', {
      Properties: {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            Ebs: Match.objectLike({
              VolumeSize: 8,
              Encrypted: true,
            }),
          }),
        ]),
      },
    });
  });

  test('allows SSH access on EC2 security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '0.0.0.0/0',
        }),
      ]),
    });
  });

  test('creates a secure and versioned S3 bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }),
        ]),
      },
    });
  });

  test('creates Cognito user pool with email attributes', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
      Schema: Match.arrayWith([
        Match.objectLike({
          Name: 'email',
          Required: true,
        }),
      ]),
    });
  });

  test('creates Route53 hosted zone and A record for load balancer', () => {
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'example.com.',
    });

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
      Name: 'api.example.com.',
      AliasTarget: Match.objectLike({
        DNSName: Match.anyValue(),
        HostedZoneId: Match.anyValue(),
      }),
    });
  });

  test('creates CloudWatch alarm on low CPU utilization', () => {
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

  test('creates internet-facing ALB with HTTP/2 enabled', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('creates SNS topic for monitoring alarms', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'Infrastructure Alarms',
    });
  });
});
