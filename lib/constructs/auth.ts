import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  OAuthScope,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolDomain,
} from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export interface AuthConstructProps {
  customDomain?: string;
  certificateArn?: string;
}

export class AuthConstruct extends Construct {
  public readonly userPool: UserPool;

  constructor(scope: Construct, id: string, props: AuthConstructProps = {}) {
    super(scope, id);

    this.userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: RemovalPolicy.RETAIN,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true },
      },
    });

    const client = new UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL],
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
    });

    new UserPoolDomain(this, 'UserPoolDomain', {
      userPool: this.userPool,
      ...(props.customDomain && props.certificateArn
        ? {
          customDomain: {
            domainName: props.customDomain, // Use domainName instead of domain
            certificate: Certificate.fromCertificateArn(this, 'Cert', props.certificateArn),
          },
        }
        : { cognitoDomain: { domainPrefix: `${id.toLowerCase()}-${this.node.addr}` } }), // Use cognitoDomain
    });

    this.userPool.node.addMetadata('ClientId', client.userPoolClientId);
  }
}
