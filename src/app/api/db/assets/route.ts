import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[v0] Fetching assets...');
    
    const assets = await prisma.asset.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        availabilityStatus: true,
        pricePerDay: true,
        location: true,
        state: true,
        isApproved: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    console.log(`[v0] Retrieved ${assets.length} assets`);
    
    return NextResponse.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    console.error('[v0] Error fetching assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch assets',
        count: 0,
        data: []
      },
      { status: 500 }
    );
  }
}
