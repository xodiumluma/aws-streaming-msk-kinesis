import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';

import {CfnNagHelper} from '../lib/cfn-nag-helper';

export class CfnNagAspect extends cdk.Construct implements ClassDecorator.IAspect {
  public visit(node: cdk.IConstruct): void {
    if (node instanceof lambda.Function) {
      const cfnFunction = node.node.defaultChild as lambda.CfnFunction;
      CfnNagHelper.addSuppressions(cfnFunction, [
        { Id: 'W89', Reason: 'No need to deploy this function in a VPC' },
        { Id: 'W92', Reason: 'No egress rule defined as default (all traffic allowed outbound) is enough for this resource'}
      ]);
    } else if (node instanceof logs.LogGroup) {
      const cfnLogGroup = node.node.defaultChild as logs.CfnLogGroup;
      CfnNagHelper.addSuppressions(cfnLogGroup, {
        Id: 'W84', 'Using an AWS Managed KMS key, log group data is always encrypted in CloudWatch Logs'
      });
    }
  }
}