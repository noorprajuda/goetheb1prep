import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, phase } = await request.json();
    
    console.log('Clearing conversation:', { conversationId, phase });
    
    // Here you would typically:
    // 1. Delete conversation data from database
    // 2. Clear any cached conversation data
    // 3. Reset conversation state on server
    
    // For now, we'll just log the request and return success
    // In a real implementation, you would:
    // - Connect to your database
    // - Delete the conversation record
    // - Clear any related cached data
    
    console.log(`Conversation ${conversationId} cleared for phase ${phase}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversation cleared successfully' 
    });
    
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear conversation' 
      },
      { status: 500 }
    );
  }
}
