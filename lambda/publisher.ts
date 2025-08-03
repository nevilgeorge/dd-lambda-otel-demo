import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const message = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            data: event.body || 'Hello from Publisher Lambda',
            source: 'publisher-lambda'
        };

        const command = new SendMessageCommand({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                'messageType': {
                    DataType: 'String',
                    StringValue: 'event'
                }
            }
        });

        const result = await sqsClient.send(command);

        console.log('Message published successfully SQS queue', result);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Event published successfully',
                messageId: result.MessageId,
                data: message
            })
        };
    } catch (error) {
        console.error('Error publishing message:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to publish message',
                details: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};