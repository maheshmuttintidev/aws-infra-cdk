import { Alarm, ComparisonOperator, Metric } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Instance, Vpc } from 'aws-cdk-lib/aws-ec2'; // Import Vpc
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Duration } from 'aws-cdk-lib/core'; // Correct import for Duration
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  vpc: Vpc; // Type vpc as Vpc
  instance: Instance;
  alarmTopicArn?: string; // Optional SNS topic ARN for alarm actions
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { instance, alarmTopicArn } = props;

    if (!instance) {
      console.warn('No EC2 instance provided; skipping alarm creation.');
      return;
    }

    const alarm = new Alarm(this, 'CpuLowAlarm', {
      metric: new Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: instance.instanceId,
        },
        statistic: 'Average',
        period: Duration.seconds(300),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'Triggers when CPU utilization falls below 10% for two 5-minute periods', // Add description
      actionsEnabled: !!alarmTopicArn, // Enable actions only if topic ARN is provided
    });

    // Add SNS action if alarmTopicArn is provided
    if (alarmTopicArn) {
      const topic = Topic.fromTopicArn(this, 'AlarmTopic', alarmTopicArn);
      alarm.addAlarmAction(new SnsAction(topic));
    }

    // Add metadata for alarm
    alarm.node.addMetadata('AlarmName', alarm.alarmName);
  }
}
