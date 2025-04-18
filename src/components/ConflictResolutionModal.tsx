"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Code, RefreshCw } from "lucide-react";
import { getAll, updateItem, deleteItem } from '@/lib/offline/db';
import { useOffline } from '@/context/OfflineContext';
import { useToast } from '@/components/ui/use-toast';

interface ConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Conflict {
  id: string;
  localData: any;
  serverData: any;
  storeName: string;
  timestamp: number;
}

export function ConflictResolutionModal({ 
  open, 
  onOpenChange 
}: ConflictResolutionModalProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'local' | 'server'>('local');
  const [loading, setLoading] = useState(true);
  const { conflictStores, syncNow } = useOffline();
  const { toast } = useToast();

  // Load conflicts from all stores with conflicts
  useEffect(() => {
    const loadConflicts = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        let allConflicts: Conflict[] = [];
        
        for (const store of conflictStores) {
          const storeConflicts = await getAll(`${store}_conflicts`);
          const storeConflictsWithMeta = storeConflicts.map(conflict => ({
            id: (conflict as Record<string, any>).id,
            localData: (conflict as Record<string, any>).localData,
            serverData: (conflict as Record<string, any>).serverData,
            timestamp: (conflict as Record<string, any>).timestamp,
            storeName: store
          }));
          allConflicts = allConflicts.concat(storeConflictsWithMeta);
        }
        
        setConflicts(allConflicts);
        setCurrentConflictIndex(0);
      } catch (error) {
        console.error('Error loading conflicts:', error);
        toast({
          variant: "destructive",
          title: "Failed to load conflicts",
          description: "There was an error loading data conflicts."
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadConflicts();
  }, [open, conflictStores, toast]);

  const currentConflict = conflicts[currentConflictIndex];
  
  // Function to resolve the current conflict
  const resolveConflict = async (useLocal: boolean) => {
    if (!currentConflict) return;
    
    try {
      const { id, localData, serverData, storeName } = currentConflict;
      
      // Update the main store with the chosen data
      const dataToKeep = useLocal ? localData : serverData;
      await updateItem(storeName, id, dataToKeep);
      
      // Remove from conflicts store
      await deleteItem(`${storeName}_conflicts`, id);
      
      // Remove from local conflicts array
      const updatedConflicts = conflicts.filter((_, index) => index !== currentConflictIndex);
      setConflicts(updatedConflicts);
      
      // Move to next conflict or close if none left
      if (updatedConflicts.length > 0) {
        setCurrentConflictIndex(Math.min(currentConflictIndex, updatedConflicts.length - 1));
      } else {
        // Sync after resolving all conflicts
        await syncNow();
        onOpenChange(false);
      }
      
      toast({
        title: "Conflict resolved",
        description: `Data conflict resolved using ${useLocal ? 'local' : 'server'} version.`
      });
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast({
        variant: "destructive",
        title: "Failed to resolve conflict",
        description: "There was an error resolving the data conflict."
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading conflicts...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (conflicts.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Conflicts Found</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <p>All data conflicts have been resolved.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Resolve Data Conflicts</DialogTitle>
            <Badge variant="outline" className="ml-2">
              {currentConflictIndex + 1} of {conflicts.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            <AlertCircle className="h-4 w-4 inline-block mr-1" />
            Choose which version of the data to keep for each conflict
          </p>
        </DialogHeader>
        
        {currentConflict && (
          <div className="flex-1 overflow-hidden">
            <div className="mb-4">
              <div className="flex gap-2 items-center mb-2">
                <Badge variant="secondary">
                  {currentConflict.storeName}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {currentConflict.id.substring(0, 8)}...
                </span>
              </div>
            </div>
            
            <Tabs defaultValue="local" value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'local' | 'server')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="local">Local Changes</TabsTrigger>
                <TabsTrigger value="server">Server Version</TabsTrigger>
              </TabsList>
              
              <TabsContent value="local" className="border rounded-md p-4">
                <ScrollArea className="h-[300px]">
                  <div className="flex items-start gap-2">
                    <Code className="h-5 w-5 mt-1 text-blue-500" />
                    <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(currentConflict.localData, null, 2)}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="server" className="border rounded-md p-4">
                <ScrollArea className="h-[300px]">
                  <div className="flex items-start gap-2">
                    <Code className="h-5 w-5 mt-1 text-green-500" />
                    <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(currentConflict.serverData, null, 2)}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentConflictIndex(Math.max(currentConflictIndex - 1, 0))}
              disabled={currentConflictIndex === 0}
            >
              Previous
            </Button>
            <Button 
              variant="outline"
              onClick={() => setCurrentConflictIndex(Math.min(currentConflictIndex + 1, conflicts.length - 1))}
              disabled={currentConflictIndex === conflicts.length - 1}
            >
              Next
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="default"
              onClick={() => resolveConflict(selectedTab === 'local')}
            >
              Use {selectedTab === 'local' ? 'Local' : 'Server'} Version
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 