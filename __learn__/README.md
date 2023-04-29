# AWS Kinesis and MSK Streaming Data Solution

Streaming data use cases have a common pattern where data moves from producers through streaming storage and data consumers to this storage. Producers keep on creating data, which is passed on through the ingest stage to the stream storage partition. Here it's parked on durable storage and ready for stream processing. The stream processing partition does processing in the stream storage layer and outputs to a known location.

The problem is the time consuming setup and effort that devs need to get the resources going and implement streaming data services best practices, such as IAM, logging and integration.

Both the [AWS Kinesis Streaming Data Solution](https://aws.amazon.com/solutions/implementations/aws-streaming-data-solution-for-amazon-kinesis) and [AWS MSK Streaming Data Solution](https://aws.amazon.com/solutions/implementations/aws-streaming-data-solution-for-msk) automatically set up AWS services that are required to conveniently record, store, process and output streaming data. They contain common streaming data patterns that you can pick and choose from to customise and build upon.

## Contents
- [Kinesis Streaming Data Solution Architecture](source/docs/README-Kinesis.md)
- [MSK Streaming Data Solution Architecture](source/docs/README-MSK.md)
- [AWS CDK Constructs](#aws-cdk-constructs)
- [Project layout](#project-layout)
- [Deployment](#deployment)
- [Custom builds](#creating-a-custom-build)
- [Operational metrics collection](#collection-of-operational-metrics)
- [Known-issues](#known-issues)
- [Resources](#resources)

## AWS CDK Constructs
The [CDK Solutions Constructs](https://aws.amazon.com/solutions/constructs/) make it convenient to create well-architected apps consistently. They are reviewed by AWS and employ the best practices put forth by the AWS Well-Architected Framework. 

This solution uses the following CDK Constructs:
- aws-apigateway-kinesisstreams
- aws-apigateway-lambda
- aws-kinesisfirehose-s3
- aws-kinesisstreams-lambda

## Project layout 
```
├── deployment
│   └── cdk-solution-helper  [CDK synthesized templates cleanup helper]
├── source
│   ├── bin                  [CDK app entrypoint]
│   ├── docs                 [Each solution's architecture diagrams]
│   ├── labs                 [AWS MSK labs templates]
│   ├── kinesis              [Demo apps for KPL and Apache Flink]
│   ├── lambda               [Bespoke resources for features that CloudFormation doesn't support]
│   ├── lib
│   ├── patterns             [Stack definitions]
│   ├── test                 [Unit testing]
```

## Deployment
Launch with one click from solution home pages:
- [AWS Kinesis Streaming Data Solution](https://aws.amazon.com/solutions/implementations/aws-streaming-data-solution-for-amazon-kinesis)
- [AWS MSK Streaming Data Solution](https://aws.amazon.com/solutions/implementations/aws-streaming-data-solution-for-amazon-msk)
> ** It is highly recommended to test the templates first before fielding to production. D'oh 🤣 **

## Developing a bespoke build
To develop a bespoke solution, do the following:

### Requirements
- [AWS CLI](https://aws.amazon.com/cli/)
- Node.js 14.x+ / npm 7+
- Python 3.8+
- JDK 11 (required for Flink)
- Maven 3.1+ (required for Flink)

> **Important** The following builds all patterns; to choose only one, update the [CDK entrypoint file](`source/bin/streaming-data-solution.ts`)

### A. Clone this repo
```
git clone https://github.com/aws-solutions/streaming-data-solution-for-amazon-kinesis-and-amazon-msk
```

### B. Run unit tests after customisations to check that your changes don't break existing code!
```
cd ./source
chmod +x ./run-all-tests.sh
./run-all-tests.sh
```

### C. Build to deploy
> **Important**: _build-s3_ will install AWS CDK necessary to build the solution
```
ARTIFACT_BUCKET=your-bucket-name  # Customised code will be stored in this S3 bucket
SOLUTION_NAME=your-solution-name  # Name of your bespoke solution
VERSION=your-version              # Version number of your bespoke solution

cd ./deployment && chmod +x ./build-s3-dist.sh && ./build-s3-dist.sh $ARTIFACT_BUCKET $SOLUTION_NAME $VERSION
```

> ***I noticed that the solution doesn't employ CDK deploy** This solution has some Lambda functions; CDK deploy doesn't install dependencies by default (all it does is compress the contents of _fromAsset_). Maybe next time the team can investigate using [Docker](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html#bundling-asset-code) to bundle everything.

> On top of this, Java code (such as demo apps for KPL and Kinesis Data Analytics) packaging is taken care of by _build-s3_.

### D. S3 Upload
S3 recommendations:
- Randomise your bucket names
- Check that the buckets are private
- Check bucket permissions before uploading

> **Important**: Append the region as a suffix to the bucket name (i.e. _your_bucket_name-**us-east-2**_)
```
aws s3 sync ./global-s3-assets s3://$ARTIFACT_BUCKET-us-east-2/$SOLUTION_NAME/$VERSION --acl bucket-owner-full-control
aws s3 sync ./regional-s3-assets s3://$ARTIFACT_BUCKET-us-east-2/$SOLUTION_NAME/$VERSION --acl bucket-owner-full-control
```

### E. CloudFormation template launch time
- Copy link of template uploaded to your S3 bucket (created as \$ARTIFACT_BUCKET in the previous step)
- Deploy the solution to your account by launching a new AWS CloudFormation stack

## Operational metrics telemetry 
To disable AWS anonymous telemetry spyware, see these:
a) [AWS Kinesis Streaming Data Solution implementation guide](https://docs.aws.amazon.com/solutions/latest/streaming-data-solution-for-amazon-kinesis/operational-metrics.html)
b) [AWS MSK Streaming Data Solution implementation guide](https://docs.aws.amazon.com/solutions/latest/streaming-data-solution-for-amazon-msk/operational-metrics.html)

## Known issues
- If you are using Kinesis Data Analytics, stop the app/studio notebook before deleting the stack. If it runs while the stack is being torn down, the status will change to `Updating`, and there might be errors when CloudFormation attempts to remove resources (e.g. `AWS::KinesisAnalyticsV2::ApplicationCloudWatchLoggingOption` and `Custom::VpcConfiguration` - a custom resource that sets up the app to connect to a VPC)

## Resources
### Services
- [Kinesis Data Streams](https://aws.amazon.com/kinesis/data-streams/)
- [Kinesis Data Firehose](https://aws.amazon.com/kinesis/data-firehose/)
- [Kinesis Data Analytics](https://aws.amazon.com/kinesis/data-analytics/)
- [MSK](https://aws.amazon.com/msk/)

### Other
- [Kinesis Producer Library](https://github.com/awslabs/amazon-kinesis-producer)
- [Kinesis Replay](https://github.com/aws-samples/amazon-kinesis-replay)
- [Kinesis Data Analytics Java Examples](https://github.com/aws-samples/amazon-kinesis-data-analytics-java-examples)
- [Learn Flink](https://ci.apache.org/projects/flink/flink-docs-master/learn-flink/)
- [Streaming Analytics Workshop](https://streaming-analytics.workshop.aws/flink-on-kda)
- [MSK Data Generator](https://github.com/awslabs/amazon-msk-data-generator)
- [MSK Labs](https://amazonmsk-labs.workshop.aws/en)
- [MSK as an event source for Lambda](https://aws.amazon.com/blogs/compute/using-amazon-msk-as-an-event-source-for-aws-lambda/)
- [Query MSK topics interactively with KDA Studio](https://aws.amazon.com/blogs/big-data/query-your-amazon-msk-topics-interactively-using-amazon-kinesis-data-analytics-studio/)
