import { Stack, StackProps } from 'aws-cdk-lib';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Duration } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { AuthConstruct } from './constructs/auth';
import { ComputeConstruct } from './constructs/compute';
import { DnsConstruct } from './constructs/dns';
import { MonitoringConstruct } from './constructs/monitoring';
import { StorageConstruct } from './constructs/storage';

export interface AwsInfraCdkStackProps extends StackProps {
  domainName?: string;
  certificateArn?: string;
  ec2KeyName?: string;
  alarmTopicArn?: string;
}

export class AwsInfraCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: AwsInfraCdkStackProps = {}) {
    super(scope, id, {
      ...props,
      description:
        'AWS infrastructure stack with VPC, EC2, S3, Cognito, Route 53, and CloudWatch monitoring', // Add stack description
    });

    // EC2 + VPC
    const compute = new ComputeConstruct(this, 'Compute', {
      keyName: props.ec2KeyName || process.env.EC2_KEY_NAME, // Pass SSH key name
    });

    // Application Load Balancer
    const alb = new ApplicationLoadBalancer(this, 'ALB', {
      vpc: compute.vpc,
      internetFacing: true,
      http2Enabled: true, // Enable HTTP/2 for better performance
      idleTimeout: Duration.seconds(60), // Set idle timeout
    });

    // S3 bucket
    const storage = new StorageConstruct(this, 'Storage');

    // Cognito user pool
    const auth = new AuthConstruct(this, 'Auth', {
      customDomain: props.domainName ? `auth.${props.domainName}` : undefined, // Use auth subdomain for Cognito
      certificateArn: props.certificateArn, // Pass certificate ARN for custom domain
    });

    // Route53 setup
    if (props.domainName) {
      new DnsConstruct(this, 'Dns', {
        domainName: props.domainName,
        loadBalancer: alb, // Pass ALB instead of targetVpc
      });
    } else {
      console.warn('Domain name not provided; skipping Route 53 setup.');
    }

    // SNS topic for alarms (optional)
    const alarmTopic = props.alarmTopicArn
      ? Topic.fromTopicArn(this, 'AlarmTopic', props.alarmTopicArn)
      : new Topic(this, 'AlarmTopic', {
          displayName: 'Infrastructure Alarms',
        });

    // Monitoring alarms
    new MonitoringConstruct(this, 'Monitoring', {
      vpc: compute.vpc,
      instance: compute.instance,
      alarmTopicArn: alarmTopic.topicArn, // Pass SNS topic ARN
    });

    // Add metadata for key resources
    this.node.addMetadata('VPC', compute.vpc.vpcId);
    this.node.addMetadata('Instance', compute.instance.instanceId);
    this.node.addMetadata('UserPool', auth.userPool.userPoolId);
    this.node.addMetadata('Bucket', storage.bucket.bucketName);
    this.node.addMetadata('ALB', alb.loadBalancerArn);
  }
}
