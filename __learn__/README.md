# AWS Kinesis and MSK Streaming Data Solution

Streaming data use cases have a common pattern where data moves from producers through streaming storage and data consumers to this storage. Producers keep on creating data, which is passed on through the ingest stage to the stream storage partition. Here it's parked on durable storage and ready for stream processing. The stream processing partition does processing in the stream storage layer and outputs to a known location.

The problem is the time consuming setup and effort that devs need to get the resources going and implement streaming data services best practices, such as IAM, logging and integration.

Both the [AWS Kinesis Streaming Data Solution](https://aws.amazon.com/solutions/implementations/aws-streaming-data-solution-for-amazon-kinesis) and [AWS MSK Streaming Data Solution](https://aws.amazon.com/solutions/implementations/aws-streaming-data-solution-for-msk) automatically set up AWS services that are required to conveniently record, store, process and output streaming data. They contain common streaming data patterns that you can pick and choose from to customise and build upon.

## Contents
- [Kinesis Streaming Data Solution Architecture](source/docs/README-Kinesis.md)
- [MSK Streaming Data Solution Architecture](source/docs/README-MSK.md)
- [AWS CDK Constructs](#aws-cdk-constructs)
- [Project layout](#project-structure)
- [Deployment](#deployment)
- [Custom builds](#creating-a-custom-build)

