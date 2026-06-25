import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[v0] Fetching users...');
    
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`[v0] Retrieved ${users.length} users`);
    
    return NextResponse.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('[v0] Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        count: 0,
        data: []
      },
      { status: 500 }
    );
  }
}
