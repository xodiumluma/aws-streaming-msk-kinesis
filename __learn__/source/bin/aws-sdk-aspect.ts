import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';

export class AwsSdkConfig extends cdk.Construct implements cdk.IAspect {
  private readonly solutionId: string;

  constructor(scope: cdk.Construct, id: string, solutionId: string) {
    super(scope, id);
    this.solutionId = solutionId;
  }

  public visit(node: cdk.IConstruct): void {
    let userAgent = '';
    if (node instanceof lambda.Function) {
      const runtimeFamily = node.runtime.family;
      if (runtimeFamily === lambda.RuntimeFamily.NODEJS) {
        userAgent = `{ "customUserAgent": "AwsSolution/${this.solutionId}/%%VERSION%%" }`;
      } else if (runtimeFamily === lambda.RuntimeFamily.PYTHON) {
        userAgent = `{ "user_agent_extra": "AwsSolution/${this.solutionId}/%%VERSION%%" }`;
      }
      node.addEnvironment('AWS_SDK_USER_AGENT', userAgent);
    }
  }
}