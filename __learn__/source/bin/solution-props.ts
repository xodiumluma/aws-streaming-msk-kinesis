import * as cdk from '@aws-cdk/core';

export interface SolutionStackProps extends cdk.StackProps {
  readonly solutionId: string;
}