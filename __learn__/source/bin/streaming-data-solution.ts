#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';

import { ApiGwKdsLambda } from '../patterns/apigw-kds-lambda';
import { AppRegistry } from '../lib/app-registry';
import { AwsSdkConfig } from './aws-sdk-aspect';
import { CfnNagAspect } from './cfn-nag-aspect';
import { KdsKdaApiGw } from '../patterns/kds-kda-apigw';
import { KdsKdfS3 } from '../patterns/kds-kdf-s3';
import { KplKdfS3 } from '../patterns/kpl-kds-kda';
import { MskClientStack } from '../labs/msk-client-setup';
import { MskClusterStack } from '../labs/msk-cluster-setup';
import { MskKdaS3 } from '../patterns/msk-kda-s3';
import { MskLambda } from '../patterns/msk-lamdba';
import { MskLambdaKdf } from '../patterns/msk-lambda-kdf';
import { MskLambdaRoleStack } from '../labs/msk-lambda-role';
import { MskStandalone } from '../patterns/msk-standalone-cluster';

import crypto = require('crypto');

const app = new cdk.App();
const solutionIdkKds = 'SO0124';
const solutionIdMsk = 'SO0151';
const solutionIdMskLabs = `${solutionIdMsk}labs`;

const applyAspects = (stacks: cdk.Stack[], solutionId: string) => {
  for (const stack of stacks) {
    const hash = crypto.createHash('sha256').update(stack.stackName).digest('hex');
    cdk.Aspects.of(stack).add(new AwsSdkConfig(app, `CustomUserAgent-${hash}`, solutionId));
    cdk.Aspects.of(stack).add(new CfnNagAspect(app, `CfnNag-${hash}`));
    cdk.Aspects.of(stack).add(
      new AppRegistry(stack, `AppRegistry-${hash}`, {
        solutionID: solutionId
      });
    );
  }
};

const createSolutionKinesisStacks = () => {
  const stacks: cdk.Stack[] = [];

  stacks.push(new ApiGwKdsLambda(app,
    'streaming-data-solution-for-kinesis-using-api-gateway-and-lambda',
    {
      description: `(${solutionIdKds}) - AWS Kinesis Streaming Data Solution (APIGW -> KDS -> Lambda) - version %%VERSION%%`,
      solutionId: solutionIdKds
    }
  ));

  stacks.push(new KplKdsKda(app,
    'streaming-data-solution-for-kinesis-using-kpl-and-kinesis-data-analytics',
    {
      description: `(${solutionIdKds}) - AWS Kinesis Streaming Data Solution (KPL -> KDS -> KDA) - version %%VERSION%%`,
      solutionId: solutionIdKds
    }
  ));

  stacks.push(new KdsKdfS3(app,
    'streaming-data-solution-for-kinesis-using-kinesis-data-firehose-and-amazon-s3',
    {
      description: `(${solutionIdKds}) - AWS Kinesis Streaming Data Solution (KDS -> KDF -> S3) - version %%VERSION%%`,
      solutionId: solutionIdKds
    }
  ));

  stacks.push(new KdsKdaApiGw(app,
    'streaming-data-solution-for-kinesis-using-kinesis-data-analytics-and-api-gateway',
    {
      description: `(${solutionIdKds}) - AWS Kinesis Streaming Data Solution (KDS -> KDF -> S3) - version %%VERSION%%`,
      solutionId: solutionIdKds
    }
  ));

  applyAspects(stacks, solutionIdKds);

};

