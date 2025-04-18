'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { testDatabaseConnection } from '../../lib/db-client';

export default function DatabaseTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLocalDb, setIsLocalDb] = useState<boolean | null>(null);

  // Get current env config on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = process.env.NEXT_PUBLIC_IS_LOCAL_DB === 'true';
      setIsLocalDb(isLocal);
    }
  }, []);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await testDatabaseConnection();
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Current Configuration</h2>
        <p className="mb-2">
          Environment is set to use: <strong>{isLocalDb ? 'Local PostgreSQL' : 'Supabase'}</strong>
        </p>
        <p className="mb-4 text-sm text-gray-600">
          To change this setting, update the IS_LOCAL_DB variable in your .env.local file and restart the server.
        </p>
      </div>
      
      <div className="mb-6">
        <p className="mb-4">
          This page tests your database connection based on your environment variables. 
          It will connect to either your local PostgreSQL database or Supabase.
        </p>
        
        <Button 
          onClick={handleTest} 
          disabled={loading}
          className="mr-4"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>
      
      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <h2 className="text-lg font-semibold mb-2">
            {result.success ? '✅ Success' : '❌ Error'}
          </h2>
          <p className="mb-2"><strong>Message:</strong> {result.message}</p>
          <p className="mb-2"><strong>Database:</strong> {result.isLocalDb ? 'Local PostgreSQL' : 'Supabase'}</p>
          
          <div className="mt-4">
            <h3 className="font-semibold">Environment Configuration:</h3>
            <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto">
              IS_LOCAL_DB={JSON.stringify(isLocalDb)}
              Using: {result.isLocalDb ? 'Local PostgreSQL' : 'Supabase'}
            </pre>
          </div>
          
          {result.data && (
            <div className="mt-4">
              <h3 className="font-semibold">Response Data:</h3>
              <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Database Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold">Local PostgreSQL</h3>
            <ul className="list-disc ml-4 mt-2">
              <li>Running on <code>localhost:54322</code></li>
              <li>Username: <code>postgres</code></li>
              <li>Password: <code>postgres</code></li>
              <li>Database: <code>postgres</code></li>
            </ul>
            <p className="mt-2">
              Access pgAdmin at <a href="http://localhost:5050" target="_blank" className="text-blue-600 hover:underline">http://localhost:5050</a>
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-semibold">Supabase</h3>
            <p className="mt-2">
              Access Supabase Dashboard at <a href="https://app.supabase.com" target="_blank" className="text-purple-600 hover:underline">https://app.supabase.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 