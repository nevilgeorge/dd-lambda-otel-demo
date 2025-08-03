import { SQSEvent, SQSRecord } from 'aws-lambda';

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

        // Simulate some processing work
        await new Promise(resolve => setTimeout(resolve, 100));

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