import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Duration } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export interface DnsConstructProps {
  loadBalancer: ApplicationLoadBalancer;
  domainName: string;
}

export class DnsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DnsConstructProps) {
    super(scope, id);

    const zone = new PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
      comment: 'Hosted zone for ALB routing',
    });

    new ARecord(this, 'AliasRecord', {
      zone,
      recordName: 'api',
      target: RecordTarget.fromAlias(new LoadBalancerTarget(props.loadBalancer)),
      ttl: Duration.seconds(300),
      comment: 'Alias record for ALB',
    });

    // Add metadata for hosted zone and record
    zone.node.addMetadata('HostedZoneId', zone.hostedZoneId);
    zone.node.addMetadata('RecordName', `api.${props.domainName}`);
  }
}
