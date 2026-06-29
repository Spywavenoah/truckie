import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface TestResult {
  name: string;
  status: 'success' | 'error';
  message: string;
  count?: number;
  error?: string;
  sample?: Record<string, any>[];
}

export async function GET() {
  const results: TestResult[] = [];

  try {
    // Test 1: Connection health check
    console.log('[v0] Testing database connection...');
    try {
      await prisma.$queryRaw`SELECT 1 as connected`;
      results.push({
        name: 'Connection',
        status: 'success',
        message: '✓ Database connection is healthy'
      });
    } catch (error) {
      results.push({
        name: 'Connection',
        status: 'error',
        message: '✗ Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Read Users
    console.log('[v0] Fetching users...');
    try {
      const userCount = await prisma.user.count();
      const userSample = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true
        }
      });
      results.push({
        name: 'Users',
        status: 'success',
        message: `✓ Found ${userCount} users in database`,
        count: userCount,
        sample: userSample
      });
    } catch (error) {
      results.push({
        name: 'Users',
        status: 'error',
        message: '✗ Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Read Assets
    console.log('[v0] Fetching assets...');
    try {
      const assetCount = await prisma.asset.count();
      const assetSample = await prisma.asset.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          type: true,
          availabilityStatus: true,
          pricePerDay: true,
          location: true,
          state: true,
          createdAt: true
        }
      });
      results.push({
        name: 'Assets',
        status: 'success',
        message: `✓ Found ${assetCount} assets in database`,
        count: assetCount,
        sample: assetSample
      });
    } catch (error) {
      results.push({
        name: 'Assets',
        status: 'error',
        message: '✗ Failed to fetch assets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Read Bookings
    console.log('[v0] Fetching bookings...');
    try {
      const bookingCount = await prisma.booking.count();
      const bookingSample = await prisma.booking.findMany({
        take: 3,
        select: {
          id: true,
          status: true,
          totalCost: true,
          startDate: true,
          endDate: true,
          createdAt: true
        }
      });
      results.push({
        name: 'Bookings',
        status: 'success',
        message: `✓ Found ${bookingCount} bookings in database`,
        count: bookingCount,
        sample: bookingSample
      });
    } catch (error) {
      results.push({
        name: 'Bookings',
        status: 'error',
        message: '✗ Failed to fetch bookings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Read States
    console.log('[v0] Fetching states...');
    try {
      const stateCount = await prisma.state.count();
      const stateSample = await prisma.state.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true
        }
      });
      results.push({
        name: 'States',
        status: 'success',
        message: `✓ Found ${stateCount} states in database`,
        count: stateCount,
        sample: stateSample
      });
    } catch (error) {
      results.push({
        name: 'States',
        status: 'error',
        message: '✗ Failed to fetch states',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 6: Read Transactions
    console.log('[v0] Fetching transactions...');
    try {
      const transactionCount = await prisma.transaction.count();
      results.push({
        name: 'Transactions',
        status: 'success',
        message: `✓ Found ${transactionCount} transactions in database`,
        count: transactionCount
      });
    } catch (error) {
      results.push({
        name: 'Transactions',
        status: 'error',
        message: '✗ Failed to fetch transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 7: Read Drivers
    console.log('[v0] Fetching drivers...');
    try {
      const driverCount = await prisma.driver.count();
      results.push({
        name: 'Drivers',
        status: 'success',
        message: `✓ Found ${driverCount} drivers in database`,
        count: driverCount
      });
    } catch (error) {
      results.push({
        name: 'Drivers',
        status: 'error',
        message: '✗ Failed to fetch drivers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 8: Read Maintenance Logs
    console.log('[v0] Fetching maintenance logs...');
    try {
      const maintenanceCount = await prisma.maintenanceLog.count();
      results.push({
        name: 'Maintenance Logs',
        status: 'success',
        message: `✓ Found ${maintenanceCount} maintenance logs in database`,
        count: maintenanceCount
      });
    } catch (error) {
      results.push({
        name: 'Maintenance Logs',
        status: 'error',
        message: '✗ Failed to fetch maintenance logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: errorCount === 0,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        passed: successCount,
        failed: errorCount
      },
      results
    });
  } catch (error) {
    console.error('[v0] Test suite error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        results: []
      },
      { status: 500 }
    );
  }
}
