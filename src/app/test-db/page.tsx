'use client';

import { useEffect, useState } from 'react';

interface DbTestResult {
  status: 'loading' | 'success' | 'error';
  message: string;
  data?: Record<string, any>;
  error?: string;
}

export default function DatabaseTestPage() {
  const [results, setResults] = useState<DbTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    const newResults: DbTestResult[] = [];

    try {
      // Test 1: Connection health check
      console.log('[v0] Testing database connection...');
      const healthRes = await fetch('/api/db/health');
      const healthData = await healthRes.json();
      
      if (healthData.status === 'connected') {
        newResults.push({
          status: 'success',
          message: '✓ Database Connection: Connected',
          data: { timestamp: healthData.timestamp }
        });
      } else {
        newResults.push({
          status: 'error',
          message: '✗ Database Connection: Failed',
          error: healthData.error
        });
      }

      // Test 2: Read Users
      console.log('[v0] Fetching users...');
      const usersRes = await fetch('/api/db/users');
      const usersData = await usersRes.json();
      
      if (usersData.success) {
        newResults.push({
          status: 'success',
          message: `✓ Read Users: Found ${usersData.count} users`,
          data: usersData.data
        });
      } else {
        newResults.push({
          status: 'error',
          message: '✗ Read Users: Failed',
          error: usersData.error
        });
      }

      // Test 3: Read Assets
      console.log('[v0] Fetching assets...');
      const assetsRes = await fetch('/api/db/assets');
      const assetsData = await assetsRes.json();
      
      if (assetsData.success) {
        newResults.push({
          status: 'success',
          message: `✓ Read Assets: Found ${assetsData.count} assets`,
          data: assetsData.data
        });
      } else {
        newResults.push({
          status: 'error',
          message: '✗ Read Assets: Failed',
          error: assetsData.error
        });
      }

      // Test 4: Read Bookings
      console.log('[v0] Fetching bookings...');
      const bookingsRes = await fetch('/api/db/bookings');
      const bookingsData = await bookingsRes.json();
      
      if (bookingsData.success) {
        newResults.push({
          status: 'success',
          message: `✓ Read Bookings: Found ${bookingsData.count} bookings`,
          data: bookingsData.data
        });
      } else {
        newResults.push({
          status: 'error',
          message: '✗ Read Bookings: Failed',
          error: bookingsData.error
        });
      }

      // Test 5: Read States
      console.log('[v0] Fetching states...');
      const statesRes = await fetch('/api/db/states');
      const statesData = await statesRes.json();
      
      if (statesData.success) {
        newResults.push({
          status: 'success',
          message: `✓ Read States: Found ${statesData.count} states`,
          data: statesData.data
        });
      } else {
        newResults.push({
          status: 'error',
          message: '✗ Read States: Failed',
          error: statesData.error
        });
      }

      setResults(newResults);
    } catch (error) {
      console.error('[v0] Test error:', error);
      newResults.push({
        status: 'error',
        message: '✗ Tests Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setResults(newResults);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Database Connection Test</h1>
          <p className="text-slate-600 mb-8">Testing Neon database connectivity and data reading</p>

          <button
            onClick={runTests}
            disabled={isRunning}
            className="mb-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors font-medium"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests Again'}
          </button>

          <div className="space-y-4">
            {results.length === 0 && !isRunning && (
              <div className="text-center py-8 text-slate-500">
                Click "Run Tests Again" to start tests
              </div>
            )}

            {isRunning && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-slate-600">Running tests...</p>
              </div>
            )}

            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-400'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <p className="font-semibold text-slate-900 mb-1">{result.message}</p>
                {result.error && (
                  <p className="text-sm text-red-600 font-mono">{result.error}</p>
                )}
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                      View Data
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto max-h-60 text-slate-700">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">What This Tests:</h3>
            <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
              <li>Database connection to Neon</li>
              <li>Reading from User table</li>
              <li>Reading from Asset table</li>
              <li>Reading from Booking table</li>
              <li>Reading from State table</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
