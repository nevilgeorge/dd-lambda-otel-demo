#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { OTelLambdaStack } from '../lib/otel-lambda-stack';
import { DatadogLambdaStack } from '../lib/datadog-lambda-stack';

const app = new cdk.App();

// OTel-enabled stack with OpenTelemetry instrumentation
new OTelLambdaStack(app, 'OTelLambdaStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'ap-northeast-1' 
  }
});

// Pure Datadog stack without OTel instrumentation
new DatadogLambdaStack(app, 'DatadogLambdaStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'ap-northeast-1' 
  }
});