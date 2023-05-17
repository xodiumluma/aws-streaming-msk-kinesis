# CDK project
Here in this solution the AWS CDK is used to create necessary AWS resources
The top-level stacks are defined in the `patterns` folder

## Utilising individual constructs
Every construct is located in `lib`, they can be used on their own.
For example, let's go through an example where there's an existing AWS Lambda function processing records from a Kinesis data stream without alarms or monitoring required.

> **Important**: Lambda and Kinesis monitoring construct is defined on [kds-monitoring.ts](lib/kds-monitoring.ts) and extends [monitoring-base.ts](libs/monitoring-base.ts)

### 1. Amending alarm thresholds
After going through the defaults, change the thresholds to align better with what we're doing.
```diff
-private readonly KDS_READ_WRITE_PROVISIONED_THRESHOLD: number = 0.01;
+private readonly KDS_READ_WRITE_PROVISIONED_THRESHOLD: number = 0.05;

-private readonly KDS_PUT_RECORDS_THRESHOLD: number = 0.95;
+private readonly KDS_PUT_RECORDS_THRESHOLD: number = 0.90;
```

### 2. Increase number of alarms (optional)
Unmodified - construct will add all metrics recommended in the [dev guide](https://docs.aws.amazon.com/streams/latest/dev/monitoring-with-cloudwatch.html#kinesis-metric-use), and we can also add others (e.g. _IncomingBytes_).