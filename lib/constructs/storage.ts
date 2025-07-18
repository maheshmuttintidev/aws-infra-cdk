import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib/core';

export class StorageConstruct extends Construct {
  public readonly bucket: Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a logging bucket for server access logs
    const logBucket = new Bucket(this, 'LogBucket', {
      bucketName: `log-${id.toLowerCase()}-${this.node.addr}`, // Unique name for logging bucket
      removalPolicy: RemovalPolicy.RETAIN, // Retain logs to prevent accidental deletion
      encryption: BucketEncryption.S3_MANAGED, // Encrypt logs with S3-managed keys
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL, // Block all public access
    });

    // Create the main S3 bucket with best practices
    this.bucket = new Bucket(this, 'Bucket', {
      bucketName: `data-${id.toLowerCase()}-${this.node.addr}`, // Unique bucket name
      encryption: BucketEncryption.S3_MANAGED, // Use S3-managed encryption for simplicity
      versioned: true, // Enable versioning for data recovery (increases costs)
      removalPolicy: RemovalPolicy.RETAIN, // Retain bucket on stack deletion
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL, // Explicitly block all public access
      serverAccessLogsBucket: logBucket, // Enable server access logging
      serverAccessLogsPrefix: 'access-logs/', // Prefix for access logs
    });
  }
}
