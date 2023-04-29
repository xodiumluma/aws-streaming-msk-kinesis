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
 bin                  [CDK app entrypoint]
 docs                 [Each solution's architecture diagrams]
 labs                 [AWS MSK labs templates]
 kinesis              [Demo apps for KPL and Apache Flink]
 lambda               [Bespoke resources for features that CloudFormation doesn't support]
 lib
 patterns             [Stack definitions]
 test                 [Unit testing]
```