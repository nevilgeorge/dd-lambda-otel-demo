import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class LambdaOtelDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SQS Queue
    const queue = new sqs.Queue(this, 'EventQueue', {
      queueName: 'nev-lambda-otel-sqs-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14)
    });

    // OpenTelemetry Lambda Layer ARNs for ap-northeast-1
    const otelCollectorLayerArn = `arn:aws:lambda:ap-northeast-1:184161586896:layer:opentelemetry-collector-amd64-0_16_0:1`;
    const otelNodejsLayerArn = `arn:aws:lambda:ap-northeast-1:184161586896:layer:opentelemetry-nodejs-0_15_0:1`;

    // Datadog fields.
    const ddOtlpTracesEndpoint = 'https://trace.agent.datadoghq.com/api/v0.2/traces';
    const ddApiKey = process.env.DD_API_KEY || '';
    const ddSource = 'datadog';

    // Create Publisher Lambda Function
    const publisherFunction = new lambda.Function(this, 'PublisherFunction', {
      functionName: 'nev-lambda-otel-publisher',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'dist/publisher.handler',
      code: lambda.Code.fromAsset('lambda'),
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(this, 'OtelCollectorLayerPublisher', otelCollectorLayerArn),
        lambda.LayerVersion.fromLayerVersionArn(this, 'OtelNodejsLayerPublisher', otelNodejsLayerArn)
      ],
      environment: {
        QUEUE_URL: queue.queueUrl,
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
        OTEL_SERVICE_NAME: 'nev-lambda-otel-publisher',
        OTEL_SERVICE_VERSION: '1.0.0',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=nev-lambda-otel-publisher,service.version=1.0.0',
        OTEL_PROPAGATORS: 'tracecontext,baggage',
        OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: 'http/protobuf',
        OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: 'https://api.datadoghq.com/api/intake/otlp/v1/metrics',
        OTEL_EXPORTER_OTLP_METRICS_HEADERS: `dd-api-key=${ddApiKey},dd-otlp-source=${ddSource}`,
        OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: 'delta',
        OPENTELEMETRY_COLLECTOR_CONFIG_URI: '/var/task/collector.yaml',
        DD_OTLP_TRACES_ENDPOINT: ddOtlpTracesEndpoint,
        DD_API_KEY: ddApiKey,
        DD_SERVICE: 'dd-otel-lambda-demo',
        DD_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(30)
    });




    // Create Consumer Lambda Function
    const consumerFunction = new lambda.Function(this, 'ConsumerFunction', {
      functionName: 'nev-lambda-otel-consumer',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'dist/consumer.handler',
      code: lambda.Code.fromAsset('lambda'),
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(this, 'OtelCollectorLayerConsumer', otelCollectorLayerArn),
        lambda.LayerVersion.fromLayerVersionArn(this, 'OtelNodejsLayerConsumer', otelNodejsLayerArn)
      ],
      environment: {
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
        OTEL_SERVICE_NAME: 'nev-lambda-otel-consumer',
        OTEL_SERVICE_VERSION: '1.0.0',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=nev-lambda-otel-consumer,service.version=1.0.0',
        OTEL_PROPAGATORS: 'tracecontext,baggage',
        OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: 'http/protobuf',
        OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: 'https://api.datadoghq.com/api/intake/otlp/v1/metrics',
        OTEL_EXPORTER_OTLP_METRICS_HEADERS: `dd-api-key=${ddApiKey},dd-otlp-source=${ddSource}`,
        OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: 'delta',
        OPENTELEMETRY_COLLECTOR_CONFIG_URI: '/var/task/collector.yaml',
        DD_OTLP_TRACES_ENDPOINT: ddOtlpTracesEndpoint,
        DD_API_KEY: ddApiKey,
        DD_SERVICE: 'dd-otel-lambda-demo',
        DD_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(30)
    });

    // Grant permissions for publisher to send messages to SQS
    queue.grantSendMessages(publisherFunction);

    // Create Backend Lambda Function
    const backendFunction = new lambda.Function(this, 'BackendFunction', {
      functionName: 'nev-lambda-otel-backend',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'dist/backend.handler',
      code: lambda.Code.fromAsset('lambda'),
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(this, 'OtelCollectorLayerBackend', otelCollectorLayerArn),
        lambda.LayerVersion.fromLayerVersionArn(this, 'OtelNodejsLayerBackend', otelNodejsLayerArn)
      ],
      environment: {
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
        OTEL_SERVICE_NAME: 'nev-lambda-otel-backend',
        OTEL_SERVICE_VERSION: '1.0.0',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=nev-lambda-otel-backend,service.version=1.0.0',
        OTEL_PROPAGATORS: 'tracecontext,baggage',
        OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: 'http/protobuf',
        OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: 'https://api.datadoghq.com/api/intake/otlp/v1/metrics',
        OTEL_EXPORTER_OTLP_METRICS_HEADERS: `dd-api-key=${ddApiKey},dd-otlp-source=${ddSource}`,
        OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: 'delta',
        OPENTELEMETRY_COLLECTOR_CONFIG_URI: '/var/task/collector.yaml',
        DD_OTLP_TRACES_ENDPOINT: ddOtlpTracesEndpoint,
        DD_API_KEY: ddApiKey,
        DD_SERVICE: 'dd-otel-lambda-demo',
        DD_ENV: 'production',
      },
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

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });
  }
}
