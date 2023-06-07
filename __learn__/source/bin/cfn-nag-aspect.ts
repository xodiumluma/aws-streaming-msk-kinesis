import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-sdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-sdk/aws-logs';

import { CfnNagHelper } from '../lib/cfn-nag-helper';

export class CfnNagAspect extends cdk.Construct implements cdk.IAspect {
  public visit(node: cdk.IConstruct): void {
    if (node instanceof lambda.Function) {
      const cfnFunction = node.node.defaultCnild as lambda.CfnFunction;
      CfnNagHelper.addSuppressions(cfnFunction, [
        {
          Id: 'W89',
          Reason: 'No need to deploy this function in a VPC'
        },
        {
          Id: 'W92',
          Reason: 'No need for reserved concurrency for this function'
        }
      ]);
    } else if (node instanceof ec2.CfnSecurityGroup) {
      CfnNagHelper.addSuppressions(node, {
        Id: 'F1000',
        Reason: 'For this resource, there\'s no default egress rule - all traffic is allowed outbound'
      });
    } else if (node instanceof logs.LogGroup) {
      const cfnLogGroup = node.node.defaultChild as logs.CfnLogGroup;
      CfnNagHelper.addSuppressions(cfnLogGroup, {
        Id: 'W84',
        Reason: 'Using an AWS Managed KMS Key, log group data is always encrypted in CloudWatch Logs'
      });
    }
  }
}