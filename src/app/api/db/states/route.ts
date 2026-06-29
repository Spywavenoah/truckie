import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[v0] Fetching states...');
    
    const states = await prisma.state.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        _count: {
          select: { lgas: true }
        }
      }
    });

    console.log(`[v0] Retrieved ${states.length} states`);
    
    return NextResponse.json({
      success: true,
      count: states.length,
      data: states
    });
  } catch (error) {
    console.error('[v0] Error fetching states:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch states',
        count: 0,
        data: []
      },
      { status: 500 }
    );
  }
}
