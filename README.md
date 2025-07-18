# AWS Infra CDK

**(AWS Infrastructure – Cloud Development Kit)**

- Manage AWS resources with CDK and TypeScript (or) Manages your entire AWS infrastructure using CDK in TypeScript.
- Ideal for defining VPCs, EC2, IAM roles, S3, Cognito—all in code.
- Purpose: scalable, reusable, strongly typed infrastructure-as-code.


## Prerequisites

* Node.js v18 or later
* npm v9 or later
* AWS CLI installed
* AWS credentials configured
* Git installed

## Setup

Clone the repo

```bash
git clone https://github.com/maheshmuttintidev/aws-infra-cdk.git
cd aws-infra-cdk
```

Install dependencies

```bash
npm install
```

## Configuration

Create a `.env` file in project root

```env
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-east-1
DOMAIN_NAME=your-real-domain.com
EC2_KEY_NAME=my-key-pair
COGNITO_CUSTOM_DOMAIN=auth.your-real-domain.com
CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/abc123
ALARM_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:my-alarm-topic
BUCKET_NAME=my-data-bucket
LOG_BUCKET_NAME=my-log-bucket
```

Set CDK context in `cdk.json` if needed

```json
{
  "app": "npx ts-node --prefer-tsconfig lib/aws-infra-cdk-stack.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true
  },
  "watch": {
    "include": ["lib/**/*.ts", "test/**/*.ts"],
    "exclude": ["node_modules", "cdk.out"]
  },
  "test": "jest",
  "requireApproval": "never"
}
```

## Build

Compile TypeScript

```bash
npm run build
```

## Lint and Format

Lint code

```bash
npm run lint
```

Auto fix and remove unused imports

```bash
npm run lint:fix
```

Format code

```bash
npm run format
```

## Test

Run unit tests

```bash
npm test
```

## CDK Bootstrap

Prepare your AWS environment

```bash
npm run cdk:bootstrap
```

## CDK Diff

Preview changes

```bash
npm run cdk:diff
```

## CDK Deploy

Deploy stack

```bash
npm run cdk:deploy
```

## CDK Destroy

Remove stack

```bash
cdk destroy
```

## Commands Reference

* `npm run build`
* `npm run watch`
* `npm run lint`
* `npm run lint:fix`
* `npm run format`
* `npm test`
* `npm run cdk:bootstrap`
* `npm run cdk:deploy`
* `npm run cdk:diff`
* `npm run init:infra`

## Project Structure

* `bin/` entry point
* `lib/` CDK stack and constructs
* `test/` unit tests
* `.github/workflows` CI config

## Contributing

* Fork the repo
* Create feature branch
* Run tests and lint
* Open pull request

## License

[MIT License](LICENSE)
