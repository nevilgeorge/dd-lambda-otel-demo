# Lambda OpenTelemetry Demo

This project demonstrates AWS Lambda functions with two different APM (Application Performance Monitoring) approaches to compare the out-of-the-box APM product between OpenTelemetry and Datadog:

1. **OTelLambdaStack**: Lambda functions instrumented with OpenTelemetry layers for distributed tracing using the official [OpenTelemetry Lambda layers](https://github.com/open-telemetry/opentelemetry-lambda)
2. **DatadogLambdaStack**: Lambda functions using Datadog's native Lambda monitoring with the [Datadog CDK constructs](https://github.com/DataDog/datadog-cdk-constructs)

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

3. **Deploy both stacks**:
   ```bash
   npm run build
   cdk deploy --all
   ```

   Or deploy individually:
   ```bash
   cdk deploy OTelLambdaStack
   cdk deploy DatadogLambdaStack
   ```

## Architecture

The project creates two separate CDK stacks, each with identical Lambda function architectures but different APM instrumentation:

### OTelLambdaStack (OpenTelemetry-based)
```
┌─────────────────┐    HTTP POST     ┌─────────────────┐
│   API Gateway   │ ────────────────▶ │  Publisher λ    │
│                 │                   │ (nev-otel-      │
└─────────────────┘                   │  lambda-publisher)│
                                      └─────────┬───────┘
                                                │ Publish Message
                                                ▼
                                      ┌─────────────────┐
                                      │   SQS Queue     │
                                      │ (nev-otel-      │
                                      │  lambda-sqs-queue)│
                                      └─────────┬───────┘
                                                │ Trigger
                                                ▼
                                      ┌─────────────────┐
                                      │  Consumer λ     │
                                      │ (nev-otel-      │    Direct Invoke
                                      │  lambda-consumer)│ ─────────────────┐
                                      └─────────────────┘                   │
                                                                            ▼
                                                                  ┌─────────────────┐
                                                                  │   Backend λ     │
                                                                  │ (nev-otel-      │
                                                                  │  lambda-backend)│
                                                                  └─────────────────┘

OpenTelemetry Data Flow:
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Each Lambda Function                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐              │
│  │ OTel NodeJS     │────▶│ OTel Collector  │────▶│   Datadog       │              │
│  │ Auto-           │     │ (collector.yaml)│     │   Backends      │              │
│  │ Instrumentation │     │                 │     │                 │              │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘              │
│          │                        │                        │                      │
│          │                        │                        ├─ Traces             │
│     Captures:                 Processes:              ├─ Metrics            │
│     • HTTP requests            • Batching              └─ Logs               │
│     • AWS SDK calls           • Resource tagging                            │
│     • Lambda runtime          • Protocol conversion                         │
│     • Direct invocations                                                    │
│     • Console.log calls                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### DatadogLambdaStack (Native Datadog)
```
┌─────────────────┐    HTTP POST     ┌─────────────────┐
│   API Gateway   │ ────────────────▶ │  Publisher λ    │
│                 │                   │ (nev-datadog-   │
└─────────────────┘                   │  lambda-publisher)│
                                      └─────────┬───────┘
                                                │ Publish Message
                                                ▼
                                      ┌─────────────────┐
                                      │   SQS Queue     │
                                      │ (nev-datadog-   │
                                      │  lambda-sqs-queue)│
                                      └─────────┬───────┘
                                                │ Trigger
                                                ▼
                                      ┌─────────────────┐
                                      │  Consumer λ     │
                                      │ (nev-datadog-   │    Direct Invoke
                                      │  lambda-consumer)│ ─────────────────┐
                                      └─────────────────┘                   │
                                                                            ▼
                                                                  ┌─────────────────┐
                                                                  │   Backend λ     │
                                                                  │ (nev-datadog-   │
                                                                  │  lambda-backend)│
                                                                  └─────────────────┘

Datadog Native Monitoring:
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Each Lambda Function                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐              │
│  │ Datadog         │────▶│ Datadog         │────▶│   Datadog       │              │
│  │ Node.js         │     │ Lambda          │     │   Backends      │              │
│  │ Layer           │     │ Extension       │     │                 │              │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘              │
│          │                        │                        │                      │
│          │                        │                        ├─ Traces             │
│     Captures:                 Processes:              ├─ Metrics            │
│     • HTTP requests            • Lambda monitoring      ├─ Logs               │
│     • AWS SDK calls           • Cold start detection    ├─ Custom metrics    │
│     • Lambda runtime          • Enhanced monitoring     └─ Performance data  │
│     • Direct invocations                                                    │
│     • Console.log calls                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Stack Comparison

| Feature | OTelLambdaStack | DatadogLambdaStack |
|---------|-----------------|-------------------|
| **APM Approach** | OpenTelemetry instrumentation | Native Datadog monitoring |
| **Lambda Layers** | OTel Collector + NodeJS layers | Datadog Node.js + Extension layers |
| **Configuration** | Manual OTel environment variables | Datadog CDK construct configuration |
| **Trace Export** | OTLP to Datadog endpoints | Direct Datadog integration |
| **Setup Complexity** | Higher (manual configuration) | Lower (CDK construct handles it) |
| **Flexibility** | High (can export to multiple backends) | Medium (Datadog-specific) |
| **Performance** | Standard OTel overhead | Optimized Datadog performance |

## Testing

### Test OTel Stack
1. **Get the API Gateway URL** from the CDK output after deploying `OTelLambdaStack`.

2. **Send a test request**:
   ```bash
   curl -X POST https://your-otel-api-gateway-url.amazonaws.com/prod/events \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from OTel test"}'
   ```

### Test Datadog Stack
1. **Get the API Gateway URL** from the CDK output after deploying `DatadogLambdaStack`.

2. **Send a test request**:
   ```bash
   curl -X POST https://your-datadog-api-gateway-url.amazonaws.com/prod/events \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from Datadog test"}'
   ```

### Compare Results
3. **Check traces in Datadog**:
   - Go to your Datadog APM/Traces section
   - Look for traces from both stacks:
     - OTel: `nev-otel-lambda-*` services
     - Datadog: `nev-datadog-lambda-*` services
   - Compare trace quality, performance metrics, and monitoring capabilities
   - Monitor the Lambda function logs in CloudWatch for any errors

## OpenTelemetry Configuration (OTelLambdaStack)

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

## Datadog Configuration (DatadogLambdaStack)

The Datadog CDK construct automatically configures:

### Lambda Layers Used
- **Node.js Layer v127**: Latest Datadog Node.js instrumentation
- **Extension Layer v84**: Latest Datadog Lambda extension


## How It Works

### OTelLambdaStack
1. **Auto-Instrumentation**: OpenTelemetry NodeJS layer automatically instruments AWS SDK calls, HTTP requests, Lambda runtime, and direct Lambda invocations
2. **Trace Collection**: OpenTelemetry Collector layer receives traces from the instrumentation
3. **Trace Export**: Collector exports traces to Datadog via OTLP protocol
4. **Distributed Tracing**: Traces span across API Gateway → Publisher Lambda → SQS → Consumer Lambda → Backend Lambda (direct invocation)

### DatadogLambdaStack
1. **Native Integration**: Datadog Node.js layer provides automatic instrumentation
2. **Lambda Extension**: Datadog Lambda extension handles trace collection and export
3. **Direct Export**: Traces are sent directly to Datadog without intermediate collectors
4. **Enhanced Monitoring**: Additional Datadog-specific metrics and performance data

## Monitoring Comparison

| Aspect | OTelLambdaStack | DatadogLambdaStack |
|--------|-----------------|-------------------|
| **CloudWatch Logs** | OTel initialization and processing details | Standard Lambda logs with Datadog enhancement |
| **Datadog APM** | OTLP-based traces and service maps | Native Datadog traces and service maps |
| **CloudWatch Metrics** | Standard Lambda metrics | Enhanced Lambda metrics with Datadog insights |
| **SQS Metrics** | Standard SQS metrics | Standard SQS metrics |
| **Custom Metrics** | Manual OTel metric creation | Automatic Datadog metric collection |

## Datadog Configuration

### OTelLambdaStack
The OpenTelemetry Collector is configured to export traces directly to Datadog using the `collector.yaml` configuration:

```yaml
exporters:
  otlphttp:
    traces_endpoint: https://trace.agent.datadoghq.com/api/v0.2/traces
    headers:
      dd-api-key: ${env:DD_API_KEY}
      dd-protocol: "otlp"
      dd-otlp-source: datadog
```

### DatadogLambdaStack
The Datadog CDK construct automatically configures all necessary endpoints and authentication.

## Cleanup

To remove all resources:
```bash
cdk destroy --all
```

Or remove stacks individually:
```bash
cdk destroy OTelLambdaStack
cdk destroy DatadogLambdaStack
```
