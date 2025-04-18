"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOffline } from '@/context/OfflineContext';
import { putItem, deleteItem, getAll } from '@/lib/offline/db';

interface ConflictResolverProps {
  storeName: string;
  onResolved: () => void;
}

interface Conflict {
  id: string;
  clientData: any;
  serverData: any;
  timestamp: string;
}

export function ConflictResolver({ storeName, onResolved }: ConflictResolverProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConflict, setActiveConflict] = useState<Conflict | null>(null);
  const [activeTab, setActiveTab] = useState('local');
  const { syncNow } = useOffline();
  
  // Load conflicts on mount
  useState(() => {
    async function loadConflicts() {
      try {
        setLoading(true);
        const conflictData = await getAll<Conflict>(`${storeName}_conflicts`);
        setConflicts(conflictData);
        
        if (conflictData.length > 0) {
          setActiveConflict(conflictData[0]);
        }
      } catch (error) {
        console.error('Error loading conflicts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadConflicts();
  });
  
  // Resolve conflict by choosing local version
  const resolveWithLocal = async () => {
    if (!activeConflict) return;
    
    try {
      // Store the local version in the main store
      await putItem(storeName, activeConflict.clientData);
      
      // Remove the conflict
      await deleteItem(`${storeName}_conflicts`, activeConflict.id);
      
      // Update UI
      setConflicts(conflicts.filter(c => c.id !== activeConflict.id));
      setActiveConflict(conflicts.length > 1 ? conflicts[1] : null);
      
      // Trigger sync
      syncNow();
    } catch (error) {
      console.error('Error resolving conflict with local data:', error);
    }
  };
  
  // Resolve conflict by choosing server version
  const resolveWithServer = async () => {
    if (!activeConflict) return;
    
    try {
      // Store the server version in the main store
      await putItem(storeName, activeConflict.serverData);
      
      // Remove the conflict
      await deleteItem(`${storeName}_conflicts`, activeConflict.id);
      
      // Update UI
      setConflicts(conflicts.filter(c => c.id !== activeConflict.id));
      setActiveConflict(conflicts.length > 1 ? conflicts[1] : null);
    } catch (error) {
      console.error('Error resolving conflict with server data:', error);
    }
  };
  
  // Resolve conflict by merging data
  const resolveWithMerge = async () => {
    if (!activeConflict) return;
    
    try {
      // Merge the data (server wins for same fields)
      const mergedData = {
        ...activeConflict.clientData,
        ...activeConflict.serverData,
        id: activeConflict.clientData.id, // Ensure we keep the right ID
      };
      
      // Store the merged version
      await putItem(storeName, mergedData);
      
      // Remove the conflict
      await deleteItem(`${storeName}_conflicts`, activeConflict.id);
      
      // Update UI
      setConflicts(conflicts.filter(c => c.id !== activeConflict.id));
      setActiveConflict(conflicts.length > 1 ? conflicts[1] : null);
      
      // Trigger sync
      syncNow();
    } catch (error) {
      console.error('Error resolving conflict with merged data:', error);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Check if we have conflicts to resolve
  if (conflicts.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No conflicts to resolve! 🎉
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-amber-200">
      <CardHeader className="bg-amber-50 border-b border-amber-200">
        <CardTitle className="text-amber-800">Resolve Data Conflicts</CardTitle>
        <CardDescription>
          Choose which version to keep when local and server data differ
        </CardDescription>
      </CardHeader>
      
      {activeConflict && (
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="local" className="flex-1">Local Version</TabsTrigger>
              <TabsTrigger value="server" className="flex-1">Server Version</TabsTrigger>
              <TabsTrigger value="diff" className="flex-1">Differences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="local" className="p-4">
              <h3 className="text-sm font-medium mb-2">Local Changes:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-60">
                {JSON.stringify(activeConflict.clientData, null, 2)}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Last modified locally on {formatDate(activeConflict.timestamp)}
              </p>
            </TabsContent>
            
            <TabsContent value="server" className="p-4">
              <h3 className="text-sm font-medium mb-2">Server Version:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-60">
                {JSON.stringify(activeConflict.serverData, null, 2)}
              </pre>
            </TabsContent>
            
            <TabsContent value="diff" className="p-4">
              <h3 className="text-sm font-medium mb-2">Key Differences:</h3>
              <div className="space-y-2">
                {Object.keys(activeConflict.clientData).map(key => {
                  const clientValue = activeConflict.clientData[key];
                  const serverValue = activeConflict.serverData[key];
                  const isDifferent = JSON.stringify(clientValue) !== JSON.stringify(serverValue);
                  
                  if (isDifferent) {
                    return (
                      <div key={key} className="border rounded-md p-2">
                        <div className="font-medium text-xs mb-1">{key}:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-xs p-1 bg-red-50 rounded">
                            <div className="text-[10px] text-red-600 mb-1">Local:</div>
                            {typeof clientValue === 'object' 
                              ? JSON.stringify(clientValue) 
                              : String(clientValue)
                            }
                          </div>
                          <div className="text-xs p-1 bg-green-50 rounded">
                            <div className="text-[10px] text-green-600 mb-1">Server:</div>
                            {typeof serverValue === 'object' 
                              ? JSON.stringify(serverValue) 
                              : String(serverValue)
                            }
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
      
      <CardFooter className="border-t p-4 bg-muted/50 flex justify-between">
        <div className="text-sm text-muted-foreground">
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} to resolve
        </div>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resolveWithServer}
          >
            Use Server
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={resolveWithMerge}
          >
            Merge
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={resolveWithLocal}
          >
            Use Local
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 