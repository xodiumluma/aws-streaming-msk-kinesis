# CDK project
Here in this solution the AWS CDK is used to create necessary AWS resources
The top-level stacks are defined in the `patterns` folder

## Utilising individual constructs
Every construct is located in `lib`, they can be used on their own.
For example, let's go through an example where there's an existing AWS Lambda function processing records from a Kinesis data stream without alarms or monitoring required.

> **Important**: Lambda and Kinesis monitoring construct is defined on [kds-monitoring.ts](lib/kds-monitoring.ts) and extends [monitoring-base.ts](libs/monitoring-base.ts)