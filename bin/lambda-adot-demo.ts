#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaOtelDemoStack } from '../lib/lambda-otel-demo-stack';

const app = new cdk.App();
new LambdaOtelDemoStack(app, 'LambdaOtelDemoStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'ap-northeast-1' 
  }
});