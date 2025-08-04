import { SQSEvent, SQSRecord } from 'aws-lambda';
import { Lambda } from '@aws-sdk/client-lambda';

const lambda = new Lambda({});

export const handler = async (event: SQSEvent): Promise<void> => {
    for (const record of event.Records) {
        try {
            await processMessage(record);
        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }
};

const processMessage = async (record: SQSRecord): Promise<void> => {
    try {
        const messageBody = JSON.parse(record.body);
        
        console.log('Processing message:', {
            messageId: record.messageId,
            receiptHandle: record.receiptHandle,
            body: messageBody,
            attributes: record.messageAttributes
        });

        // Invoke backend function
        const backendFunctionName = process.env.BACKEND_FUNCTION_NAME;
        if (backendFunctionName) {
            console.log('Invoking backend function:', backendFunctionName);
            
            const backendPayload = {
                source: 'consumer',
                originalMessage: messageBody,
                processedAt: new Date().toISOString(),
                messageId: record.messageId
            };

            const invokeResult = await lambda.invoke({
                FunctionName: backendFunctionName,
                Payload: JSON.stringify(backendPayload),
                InvocationType: 'RequestResponse'
            });

            const backendResponse = JSON.parse(new TextDecoder().decode(invokeResult.Payload));
            console.log('Backend function response:', backendResponse);
        }

        console.log('Message processed successfully:', {
            id: messageBody.id,
            timestamp: messageBody.timestamp,
            source: messageBody.source,
            data: messageBody.data
        });

    } catch (error) {
        console.error('Failed to process message:', {
            messageId: record.messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
            body: record.body
        });
        throw error;
    }
};