#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk  from 'aws-cdk-lib';

import { ApiGwKdsLambda } from '../patterns/apigw-kds-lambda';
import { AppRegistry } from '../lib/app-registry';
import { AwsSdkConfig } from './aws-sdk-aspect';
import { CfnNagAspect } from './cfn-nag-aspect';
import { KdsKdaApiGw } from '../patterns/kds-kda-apigw';
import { KdsKdfS3 } from '../patterns/kds-kdf-s3';
import { KplKdsKda } from '../patterns/kpl-kds-kda';
import { MskClientStack } from '../labs/msk-client-setup';
import { MskClusterStack } from '../labs/msk-cluster-setup';
import { MskKdaS3 } from '../patterns/msk-kda-s3';
import { MskLambda } from '../patterns/msk-lambda';
import { MskLambdaKdf } from '../patterns/msk-lambda-kdf';
import { MskLambdaRoleStack } from '../labs/msk-lambda-role';
import { MskStandalone } from '../patterns/msk-standalone-cluster';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';

import crypto = require('crypto');

const app = new cdk.App();
const solutionIdKds = 'SO0124';
const solutionIdMsk = 'SO0151';
const solutionIdMskLabs = `${solutionIdMsk}labs`;
const solutionIdMskLambda = `${solutionIdMsk}Lambda`;
const solutionIdMskLambdaKdf = `${solutionIdMsk}LambdaKdf`;
const solutionIdMskKdaS3 = `${solutionIdMsk}KdaS3`;

function applyAspects(stacks: cdk.Stack[], solutionId: string) {
    for (const stack of stacks) {
        const hash = crypto.createHash('sha256').update(stack.stackName).digest('hex');
        cdk.Aspects.of(stack).add(new AwsSdkConfig(app, `CustomUserAgent-${hash}`, solutionId));
        cdk.Aspects.of(stack).add(new CfnNagAspect(app, `CfnNag-${hash}`));
        cdk.Aspects.of(stack).add(
            new AppRegistry(stack, `AppRegistry-${hash}`, {
                solutionID: solutionId
            })
        );
        NagSuppressions.addStackSuppressions(stack, [
            { id: 'AwsSolutions-IAM5', reason: 'IAM role requires more permissions' },
            { id: 'AwsSolutions-SQS3', reason: 'SQS is already a deadletter queue' },
            { id: 'AwsSolutions-APIG2', reason: 'Request Validation happens by default with construct and more validations can be added by customer' },
            { id: 'AwsSolutions-APIG3', reason: 'REST API stage is not associated with AWS WAFv2 web ACL because the solution is data agnostic' },
            { id: 'AwsSolutions-COG2', reason: 'Customer will need to setup MFA with their information that they want to provide' },
            { id: 'AwsSolutions-COG4', reason: 'Customer will need to setup Cognito authorizer as we have the default settings enabled. See patterns/apigw-kds-lambda.ts' },
            { id: 'AwsSolutions-VPC7', reason: 'MSKLabs do not need VPC flow logs' },
            { id: 'AwsSolutions-EC29', reason: 'EC2 does not need ASG' },
            { id: 'AwsSolutions-MSK2', reason: 'MSKLabs uses Plaintext communication' },
            { id: 'AwsSolutions-MSK6', reason: 'MSKLabs uses broker logs' },
            {id: 'AwsSolutions-S10', reason: 'Bucket policy has condition to block non HTTPS traffic' }
          ]);
    }
}

function createSolutionKinesisStacks() {
    const stacks: cdk.Stack[] = [];

    stacks.push(
        new ApiGwKdsLambda(app, 'streaming-data-solution-for-kinesis-using-api-gateway-and-lambda', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdKds}) - Streaming Data Solution for Amazon Kinesis (APIGW -> KDS -> Lambda). Version %%VERSION%%`,
            solutionId: solutionIdKds
        })
    );

    stacks.push(
        new KplKdsKda(app, 'streaming-data-solution-for-kinesis-using-kpl-and-kinesis-data-analytics', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdKds}) - Streaming Data Solution for Amazon Kinesis (KPL -> KDS -> KDA). Version %%VERSION%%`,
            solutionId: solutionIdKds
        })
    );

    stacks.push(
        new KdsKdfS3(app, 'streaming-data-solution-for-kinesis-using-kinesis-data-firehose-and-amazon-s3', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdKds}) - Streaming Data Solution for Amazon Kinesis (KDS -> KDF -> S3). Version %%VERSION%%`,
            solutionId: solutionIdKds
        })
    );

    stacks.push(
        new KdsKdaApiGw(app, 'streaming-data-solution-for-kinesis-using-kinesis-data-analytics-and-api-gateway', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdKds}) - Streaming Data Solution for Amazon Kinesis (KDS -> KDA -> APIGW). Version %%VERSION%%`,
            solutionId: solutionIdKds
        })
    );

    applyAspects(stacks, solutionIdKds);
}

function createSolutionMskStacks() {
    const stacks: cdk.Stack[] = [];

    stacks.push(
        new MskStandalone(app, 'streaming-data-solution-for-msk', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdMsk}) - Streaming Data Solution for Amazon MSK. Version %%VERSION%%`,
            solutionId: solutionIdMsk
        })
    );

    stacks.push(
        new MskLambda(app, 'streaming-data-solution-for-msk-using-aws-lambda', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdMskLambda}) - Streaming Data Solution for Amazon MSK (MSK -> Lambda). Version %%VERSION%%`,
            solutionId: solutionIdMskLambda
        })
    );

    stacks.push(
        new MskLambdaKdf(app, 'streaming-data-solution-for-msk-using-aws-lambda-and-kinesis-data-firehose', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdMskLambdaKdf}) - Streaming Data Solution for Amazon MSK (MSK -> Lambda -> KDF). Version %%VERSION%%`,
            solutionId: solutionIdMskLambdaKdf
        })
    );

    stacks.push(
        new MskKdaS3(app, 'streaming-data-solution-for-msk-using-kinesis-data-analytics-and-amazon-s3', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdMskKdaS3}) - Streaming Data Solution for Amazon MSK (MSK -> KDA -> S3). Version %%VERSION%%`,
            solutionId: solutionIdMskKdaS3
        })
    );

    applyAspects(stacks, solutionIdMsk);
}

function createSolutionMskLabsStacks() {
    const stacks: cdk.Stack[] = [];

    stacks.push(
        new MskLambdaRoleStack(app, 'amazon-msk-labs-lambda-role', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdMskLabs}) - Amazon MSK Labs (IAM Role). Version %%VERSION%%`,
            solutionId: solutionIdMskLabs
        })
    );

    stacks.push(
        new MskClientStack(app, 'amazon-msk-labs-ec2-client', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdMskLabs}) - Amazon MSK Labs (EC2 Client). Version %%VERSION%%`,
            solutionId: solutionIdMskLabs
        })
    );

    stacks.push(
        new MskClusterStack(app, 'amazon-msk-labs-cluster', {
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false,
            }),
            description: `(${solutionIdMskLabs}) - Amazon MSK Labs (MSK Cluster). Version %%VERSION%%`,
            solutionId: solutionIdMskLabs
        })
    );

    applyAspects(stacks, solutionIdMskLabs);
}

cdk.Aspects.of(app).add(new AwsSolutionsChecks());
createSolutionKinesisStacks();
createSolutionMskStacks();
createSolutionMskLabsStacks();
