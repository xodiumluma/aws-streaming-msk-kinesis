/*********************************************************************************************************************
 *  Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                      *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import * as cdk  from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Template} from 'aws-cdk-lib/assertions';

import { KafkaConsumer } from '../lib/msk-consumer';

describe('successful scenarios', () => {
    let stack: cdk.Stack;
    let lambdaCodeParams: lambda.CfnParametersCodeProps;

    beforeEach(() => {
        const app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack1');

        lambdaCodeParams = {
            bucketNameParam: new cdk.CfnParameter(stack, 'LambdaCodeBucket'),
            objectKeyParam: new cdk.CfnParameter(stack, 'LambdaCodeKey'),
        };
    });

    test('creates a MSK Lambda consumer', () => {
        new KafkaConsumer(stack, 'TestMsk', {
            clusterArn: 'arn:aws:kafka:region:account:cluster/cluster-name/cluster-uuid',
            scramSecretArn: 'my-secret-arn',
            batchSize: 10,
            enabled: true,
            startingPosition: lambda.StartingPosition.LATEST,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromCfnParameters(lambdaCodeParams),
            topicName: 'my-topic',
            environmentVariables: {
                'MY_ENV_VARIABLE': 'foo'
            }
        });

        Template.fromStack(stack).hasResource('AWS::IAM::Role', {
            Metadata: {
                cfn_nag: {
                    rules_to_suppress: [{
                        id: 'W11',
                        reason: 'Actions do not support resource level permissions'
                    }]
                }
            }
        });
    });

    test('accepts CloudFormation parameters', () => {
        const clusterArn = new cdk.CfnParameter(stack, 'ClusterArn', { type: 'String' });
        const secretArn = new cdk.CfnParameter(stack, 'SecretArn', { type: 'String' });
        const batchSize = new cdk.CfnParameter(stack, 'BatchSize', { type: 'Number' });
        const topicName = new cdk.CfnParameter(stack, 'TopicName', { type: 'String' });

        new KafkaConsumer(stack, 'TestMsk', {
            clusterArn: clusterArn.valueAsString,
            scramSecretArn: secretArn.valueAsString,
            batchSize: batchSize.valueAsNumber,
            enabled: true,
            startingPosition: lambda.StartingPosition.LATEST,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromCfnParameters(lambdaCodeParams),
            topicName: topicName.valueAsString
        });

        Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
            EventSourceArn: { Ref: 'ClusterArn' },
            BatchSize: { Ref: 'BatchSize' },
            Topics: [{ Ref: 'TopicName' }],
            SourceAccessConfigurations: [{
                Type: 'SASL_SCRAM_512_AUTH',
                URI: { Ref: 'SecretArn' }
            }]
        });
    });

describe('validation tests', () => {
    let stack: cdk.Stack;
    let lambdaCodeParams: lambda.CfnParametersCodeProps;

    beforeEach(() => {
        const app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack2');

        lambdaCodeParams = {
            bucketNameParam: new cdk.CfnParameter(stack, 'LambdaCodeBucket'),
            objectKeyParam: new cdk.CfnParameter(stack, 'LambdaCodeKey'),
        };
    });

    test.each([0, 901])('timeout must be between allowed values', (invalidTimeoutSeconds) => {
        expect(() => new KafkaConsumer(stack, 'TestMsk', {
            clusterArn: 'arn:aws:kafka:region:account:cluster/cluster-name/cluster-uuid',
            batchSize: 10,
            enabled: true,
            startingPosition: lambda.StartingPosition.LATEST,
            timeout: cdk.Duration.seconds(invalidTimeoutSeconds),
            code: lambda.Code.fromCfnParameters(lambdaCodeParams),
            topicName: 'my-topic'
        })).toThrowError(`timeout must be a value between 1 and 900 seconds (given ${invalidTimeoutSeconds})`);
    });

    test.each([-1, 0, 10001])('batch size must be between allowed values', (invalidBatchSize) => {
        expect(() => new KafkaConsumer(stack, 'TestMsk', {
            clusterArn: 'arn:aws:kafka:region:account:cluster/cluster-name/cluster-uuid',
            batchSize: invalidBatchSize,
            enabled: true,
            startingPosition: lambda.StartingPosition.LATEST,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromCfnParameters(lambdaCodeParams),
            topicName: 'my-topic'
        })).toThrowError(`batchSize must be between 1 and 10000 (given ${invalidBatchSize})`);
    });
})
});
