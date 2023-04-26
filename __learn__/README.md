# AWS Kinesis and MSK Streaming Data Solution

Streaming data use cases have a common pattern where data moves from producers through streaming storage and data consumers to this storage. Producers keep on creating data, which is passed on through the ingest stage to the stream storage partition. Here it's parked on durable storage and ready for stream processing. The stream processing partition does processing in the stream storage layer and outputs to a known location.

The problem is the time consuming setup and effort that devs need to get the resources going and implement streaming data services best practices, such as IAM, logging and integration.
