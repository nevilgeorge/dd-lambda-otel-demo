import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { DatadogLambda } from 'datadog-cdk-constructs-v2';

export class DatadogLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SQS Queue
    const queue = new sqs.Queue(this, 'EventQueue', {
      queueName: 'nev-datadog-lambda-sqs-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14)
    });

    // Datadog configuration
    const ddApiKey = process.env.DD_API_KEY || '';
    
    // Create Datadog Lambda construct for monitoring
    const datadogLambda = new DatadogLambda(this, 'DatadogLambda', {
      nodeLayerVersion: 127,
      extensionLayerVersion: 84,
      apiKey: ddApiKey,
      site: 'datadoghq.com',
      env: 'production',
      service: 'dd-lambda-demo',
      version: '1.0.0',
      enableDatadogTracing: true,
      enableDatadogLogs: true,
      captureLambdaPayload: true,
      enableColdStartTracing: false,
    });

    // Create Publisher Lambda Function
    const publisherFunction = new lambda.Function(this, 'PublisherFunction', {
      functionName: 'nev-datadog-lambda-publisher',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'dist/publisher.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Create Consumer Lambda Function
    const consumerFunction = new lambda.Function(this, 'ConsumerFunction', {
      functionName: 'nev-datadog-lambda-consumer',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'dist/consumer.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {},
      timeout: cdk.Duration.seconds(30)
    });

    // Grant permissions for publisher to send messages to SQS
    queue.grantSendMessages(publisherFunction);

    // Create Backend Lambda Function
    const backendFunction = new lambda.Function(this, 'BackendFunction', {
      functionName: 'nev-datadog-lambda-backend',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'dist/backend.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {},
      timeout: cdk.Duration.seconds(30)
    });

    // Grant permissions for consumer to receive messages from SQS
    queue.grantConsumeMessages(consumerFunction);

    // Grant permissions for consumer to invoke backend function
    backendFunction.grantInvoke(consumerFunction);

    // Add backend function name as environment variable for consumer
    consumerFunction.addEnvironment('BACKEND_FUNCTION_NAME', backendFunction.functionName);

    // Add SQS as event source for consumer Lambda
    consumerFunction.addEventSource(new lambdaEventSources.SqsEventSource(queue, {
      batchSize: 10
    }));

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'EventApi', {
      restApiName: 'Event Processing API',
      description: 'API Gateway for publishing events to SQS',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Create API Gateway Lambda integration
    const publisherIntegration = new apigateway.LambdaIntegration(publisherFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    // Add resource and method to API Gateway
    const eventsResource = api.root.addResource('events');
    eventsResource.addMethod('POST', publisherIntegration);

    // Add Datadog monitoring to all Lambda functions
    datadogLambda.addLambdaFunctions([
      publisherFunction,
      consumerFunction,
      backendFunction
    ]);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });

    // Output Datadog dashboard URL
    new cdk.CfnOutput(this, 'DatadogDashboardUrl', {
      value: `https://app.datadoghq.com/dashboard/lists?q=dd-lambda-demo`,
      description: 'Datadog Dashboard URL'
    });
  }
}
