"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';

type MigrationStatus = 'idle' | 'running' | 'success' | 'error';

interface Migration {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  status: MigrationStatus;
  message?: string;
}

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<Migration[]>([
    {
      id: 'ticket-verifications',
      name: 'Ticket Verifications Table',
      description: 'Creates the table for storing ticket verification history',
      endpoint: '/api/migrations/ticket-verifications',
      status: 'idle'
    }
  ]);

  const handleRunMigration = async (migration: Migration) => {
    // Update migration status
    setMigrations(prev => 
      prev.map(m => 
        m.id === migration.id 
          ? { ...m, status: 'running' as MigrationStatus, message: undefined } 
          : m
      )
    );

    try {
      // Call the migration endpoint
      const response = await fetch(migration.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Migration failed');
      }

      // Update migration status on success
      setMigrations(prev => 
        prev.map(m => 
          m.id === migration.id 
            ? { 
                ...m, 
                status: 'success' as MigrationStatus, 
                message: data.message || 'Migration completed successfully'
              } 
            : m
        )
      );
    } catch (error: any) {
      console.error('Migration failed:', error);
      
      // Update migration status on error
      setMigrations(prev => 
        prev.map(m => 
          m.id === migration.id 
            ? { 
                ...m, 
                status: 'error' as MigrationStatus, 
                message: error.message || 'Unknown error occurred'
              } 
            : m
        )
      );
    }
  };

  const getStatusBadge = (status: MigrationStatus) => {
    switch (status) {
      case 'idle':
        return <Badge variant="outline">Not Run</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Running</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Database Migrations</h1>
        <p className="text-muted-foreground mt-2">
          Run database migrations to update your schema
        </p>
      </div>

      <div className="grid gap-6">
        <Alert>
          <AlertTitle>Administrator Access Required</AlertTitle>
          <AlertDescription>
            Running migrations requires administrator privileges. These operations may modify database schema and data.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {migrations.map((migration) => (
            <Card key={migration.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5" />
                    {migration.name}
                  </CardTitle>
                  <CardDescription>
                    {migration.description}
                  </CardDescription>
                </div>
                <div>
                  {getStatusBadge(migration.status)}
                </div>
              </CardHeader>
              <CardContent>
                {migration.status === 'running' && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                {migration.status === 'success' && (
                  <div className="flex items-center justify-center py-6 text-green-600">
                    <CheckCircle className="h-12 w-12" />
                  </div>
                )}
                
                {migration.status === 'error' && (
                  <div className="flex items-center justify-center py-6 text-red-600">
                    <XCircle className="h-12 w-12" />
                  </div>
                )}
                
                {migration.message && (
                  <p className={`mt-4 text-sm ${
                    migration.status === 'error' ? 'text-red-600' : 
                    migration.status === 'success' ? 'text-green-600' : ''
                  }`}>
                    {migration.message}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleRunMigration(migration)} 
                  disabled={migration.status === 'running'} 
                  variant={migration.status === 'success' ? 'outline' : 'default'}
                  className="w-full"
                >
                  {migration.status === 'success' ? 'Run Again' : 'Run Migration'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 