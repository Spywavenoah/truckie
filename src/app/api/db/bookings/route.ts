import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[v0] Fetching bookings...');
    
    const bookings = await prisma.booking.findMany({
      take: 10,
      select: {
        id: true,
        status: true,
        totalCost: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        asset: {
          select: {
            id: true,
            title: true,
            type: true
          }
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    console.log(`[v0] Retrieved ${bookings.length} bookings`);
    
    return NextResponse.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('[v0] Error fetching bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings',
        count: 0,
        data: []
      },
      { status: 500 }
    );
  }
}
