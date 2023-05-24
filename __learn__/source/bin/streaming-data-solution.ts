import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';

import {ApiGwKdsLambda} from '../patterns/apigw-kds-lambda';
import {AppRegistry} from '../lib/app-registry';
import {AwsSdkConfig} from './aws-sdk-aspect';
import {CfnNagAspect} from './cfn-nag-aspect';
import {KdsKdaApiGw} from '../patterns/kds-kda-apigw';
import {KdsKdfS3} from '../patterns/kds-kdf-s3';