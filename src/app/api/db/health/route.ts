import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[v0] Health check: Attempting database connection...');
    
    // Test the connection with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    
    console.log('[v0] Health check: Connection successful');
    
    return NextResponse.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      message: 'Database connection is healthy'
    });
  } catch (error) {
    console.error('[v0] Health check failed:', error);
    return NextResponse.json(
      {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
