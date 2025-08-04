import { Context } from 'aws-lambda';

export const handler = async (event: any, context: Context) => {
  console.log('Backend function received event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  try {
    // Simulate some backend processing
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backend processing completed successfully',
        requestId: context.awsRequestId,
        processingTimeMs: Math.round(processingTime),
        processedEvent: event,
        timestamp: new Date().toISOString()
      })
    };

    console.log('Backend function response:', JSON.stringify(response, null, 2));
    return response;

  } catch (error) {
    console.error('Backend function error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Backend processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.awsRequestId
      })
    };
  }
};