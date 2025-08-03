# Lambda OpenTelemetry Demo

This project demonstrates AWS Lambda functions instrumented with OpenTelemetry layers for distributed tracing using the official OpenTelemetry Lambda layers.

## Prerequisites

1. **AWS CDK**: Make sure you have AWS CDK installed and configured.
2. **Node.js**: Version 18 or higher.
3. **Datadog API Key**: Get your API key from your Datadog account settings.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   cd lambda && npm install
   ```

2. **Set your Datadog API key**:
   ```bash
   export DD_API_KEY=your_datadog_api_key_here
   ```

3. **Deploy the stack**:
   ```bash
   npm run build
   cdk deploy
   ```

## Architecture

The stack creates:
- **SQS Queue**: For message processing
- **Publisher Lambda**: Receives HTTP requests and publishes messages to SQS (instrumented with OpenTelemetry)
- **Consumer Lambda**: Processes messages from SQS (instrumented with OpenTelemetry)
- **API Gateway**: HTTP endpoint to trigger the publisher Lambda
- **OpenTelemetry Layers**: Two layers per Lambda function:
  - Collector Layer: Embeds OpenTelemetry Collector for trace export
  - NodeJS Layer: Provides Node.js auto-instrumentation

## Testing

1. **Get the API Gateway URL** from the CDK output after deployment.

2. **Send a test request**:
   ```bash
   curl -X POST https://your-api-gateway-url.amazonaws.com/prod/events \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from test"}'
   ```

3. **Check traces in Datadog**:
   - Go to your Datadog APM/Traces section
   - Look for traces from `nev-lambda-otel-publisher` and `nev-lambda-otel-consumer` services
   - Monitor the Lambda function logs in CloudWatch for any errors
   - Verify that messages are being processed correctly

## OpenTelemetry Configuration

The Lambda functions are automatically instrumented with:

### Environment Variables
- `AWS_LAMBDA_EXEC_WRAPPER=/opt/otel-handler`: Enables auto-instrumentation
- `OTEL_SERVICE_NAME`: Unique service name for each Lambda
- `OTEL_SERVICE_VERSION`: Version identifier
- `OTEL_RESOURCE_ATTRIBUTES`: Additional resource attributes for traces
- `OTEL_PROPAGATORS`: Configures trace context propagation

### Lambda Layers Used
- **Collector Layer v0.16.0**: `arn:aws:lambda:ap-northeast-1:184161586896:layer:opentelemetry-collector-amd64-0_16_0:1`
- **NodeJS Layer v0.15.0**: `arn:aws:lambda:ap-northeast-1:184161586896:layer:opentelemetry-nodejs-0_15_0:1`

## How It Works

1. **Auto-Instrumentation**: OpenTelemetry NodeJS layer automatically instruments AWS SDK calls, HTTP requests, and Lambda runtime
2. **Trace Collection**: OpenTelemetry Collector layer receives traces from the instrumentation
3. **Trace Export**: Configure the collector to export traces to your observability backend
4. **Distributed Tracing**: Traces span across API Gateway → Publisher Lambda → SQS → Consumer Lambda

## Monitoring

- **CloudWatch Logs**: Check Lambda function logs for OpenTelemetry initialization and processing details
- **Distributed Traces**: View end-to-end traces in your observability platform
- **CloudWatch Metrics**: Monitor Lambda invocations, errors, and duration
- **SQS Metrics**: Monitor queue depth and message processing rates

## Configuring Trace Export

By default, the OpenTelemetry Collector layer exports traces to CloudWatch. To export to other systems:

1. Configure collector environment variables to specify exporters
2. Add necessary network access for your observability backend
3. Set authentication credentials as needed

Example environment variables for common exporters:
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-backend.com/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=x-api-key=your-key
```

## Cleanup

To remove all resources:
```bash
cdk destroy
```
