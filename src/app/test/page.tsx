'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { testSupabaseConnection } from '../../lib/test-connection';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    const response = await testSupabaseConnection();
    setResult(response);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Supabase Connection</h1>
      <Button onClick={handleTest}>
        Test Connection
      </Button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
} 