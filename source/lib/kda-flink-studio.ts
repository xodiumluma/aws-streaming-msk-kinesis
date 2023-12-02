/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
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
import { Construct } from 'constructs';
import { aws_kinesisanalytics as analytics, aws_iam as iam, aws_glue as glue } from 'aws-cdk-lib';

import { CfnNagHelper } from './cfn-nag-helper';
import { FlinkBase, FlinkBaseProps } from './kda-base';

export interface FlinkStudioProps extends FlinkBaseProps {
    readonly clusterArn?: string;
}

export class FlinkStudio extends FlinkBase {
    private DatabaseName: string = '';

    constructor(scope: Construct, id: string, props: FlinkStudioProps) {
        super(scope, id, props);
        this.addCfnNagSuppressions();
    }

    protected createRole(_props: FlinkStudioProps): iam.IRole {
        const glueDb = new glue.CfnDatabase(this, 'Database', {
            catalogId: cdk.Aws.ACCOUNT_ID,
            databaseInput: {
                description: `${cdk.Aws.STACK_NAME} - Database for Amazon Kinesis Data Analytics Studio`
            }
        });

        this.DatabaseName = glueDb.ref;

        const logsPolicy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    resources: [`arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:*`],
                    actions: ['logs:DescribeLogGroups']
                }),
                new iam.PolicyStatement({
                    resources: [this.LogGroup.logGroupArn],
                    actions: ['logs:DescribeLogStreams', 'logs:PutLogEvents']
                })
            ]
        });

        const vpcPolicy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: [
                        'ec2:CreateNetworkInterface',
                        'ec2:DescribeNetworkInterfaces',
                        'ec2:DescribeVpcs',
                        'ec2:DeleteNetworkInterface',
                        'ec2:DescribeDhcpOptions',
                        'ec2:DescribeSubnets',
                        'ec2:DescribeSecurityGroups'
                    ]
                }),
                new iam.PolicyStatement({
                    resources: [`arn:${cdk.Aws.PARTITION}:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:network-interface/*`],
                    actions: ['ec2:CreateNetworkInterfacePermission']
                })
            ]
        });

        // This policy is based on https://docs.aws.amazon.com/kinesisanalytics/latest/java/how-zeppelin-appendix-iam.html
        const gluePolicy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:connection/*`,
                        `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:table/${this.DatabaseName}/*`,
                        `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:database/${this.DatabaseName}`,
                        `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:database/hive`,
                        `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:catalog`,
                        `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:userDefinedFunction/*`
                    ],
                    actions: [
                        'glue:GetConnection',
                        'glue:GetTable',
                        'glue:GetTables',
                        'glue:GetDatabase',
                        'glue:CreateTable',
                        'glue:UpdateTable',
                        'glue:GetUserDefinedFunction'
                    ]
                }),
                new iam.PolicyStatement({
                    resources: ['*'],
                    actions: ['glue:GetDatabases']
                }),
            ]
        });

        const kdaRole = new iam.Role(this, 'AppRole', {
            assumedBy: new iam.ServicePrincipal('kinesisanalytics.amazonaws.com'),
            inlinePolicies: {
                LogsPolicy: logsPolicy,
                VpcPolicy: vpcPolicy,
                GluePolicy: gluePolicy
            }
        });

        if (_props.clusterArn !== undefined) {
            const components = cdk.Arn.split(_props.clusterArn, cdk.ArnFormat.SLASH_RESOURCE_NAME);
            const clusterName = components.resourceName!;

            const mskPolicy = new iam.PolicyStatement({
                sid: 'IamPolicy',
                actions: [
                    'kafka-cluster:Connect',
                    'kafka-cluster:DescribeGroup',
                    'kafka-cluster:AlterGroup',
                    'kafka-cluster:DescribeTopic',
                    'kafka-cluster:ReadData',
                    'kafka-cluster:DescribeClusterDynamicConfiguration'
                ],
                resources: [
                    _props.clusterArn,
                    // TODO: Remove `*` once issue with Arn.Split has been resolved.
                    `arn:${cdk.Aws.PARTITION}:kafka:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topic/${clusterName}/*/*`,
                    `arn:${cdk.Aws.PARTITION}:kafka:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:group/${clusterName}/*/*`
                ]
            });

            kdaRole.addToPolicy(mskPolicy);
        }

        return kdaRole;
    }

    protected createApplication(_props: FlinkStudioProps): analytics.CfnApplicationV2 {
        return new analytics.CfnApplicationV2(this, 'Studio', {
            runtimeEnvironment: 'ZEPPELIN-FLINK-2_0',
            applicationMode: 'INTERACTIVE',
            serviceExecutionRole: this.Role.roleArn,
            applicationConfiguration: {
                zeppelinApplicationConfiguration: {
                    catalogConfiguration: {
                        glueDataCatalogConfiguration: {
                            databaseArn: `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:database/${this.DatabaseName}`
                        }
                    },
                    monitoringConfiguration: {
                        logLevel: _props.logLevel
                    },
                    customArtifactsConfiguration: [
                        {
                            artifactType: 'DEPENDENCY_JAR',
                            mavenReference: {
                                groupId: 'org.apache.flink',
                                artifactId: 'flink-sql-connector-kinesis_2.12',
                                version: '1.13.2'
                            }
                        },
                        {
                            artifactType: 'DEPENDENCY_JAR',
                            mavenReference: {
                                groupId: 'org.apache.flink',
                                artifactId: 'flink-connector-kafka_2.12',
                                version: '1.13.2'
                            }
                        },
                        {
                            artifactType: 'DEPENDENCY_JAR',
                            mavenReference: {
                                groupId: 'software.amazon.msk',
                                artifactId: 'aws-msk-iam-auth',
                                version: '1.1.0'
                            }
                        }
                    ]
                }
            }
        });
    }

    private addCfnNagSuppressions() {
        const cfnRole = this.Role.node.defaultChild as iam.CfnRole;
        CfnNagHelper.addSuppressions(cfnRole, {
            Id: 'W11',
            Reason: 'EC2 actions do not support resource level permissions / Studio uses default Glue database'
        });
    }
}
