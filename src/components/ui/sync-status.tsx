"use client";

import { useOffline } from "@/context/OfflineContext";
import { format } from "date-fns";
import { Loader2, CloudOff, RefreshCw, Check, Clock } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export function SyncStatus({ showForceSync = true }: { showForceSync?: boolean }) {
  const { isOffline, isSyncing, pendingChanges, lastSyncTime, syncNow } = useOffline();
  
  // Format last sync time
  const formattedLastSync = lastSyncTime 
    ? format(lastSyncTime, "MMM d, h:mm a")
    : "Never";
  
  return (
    <TooltipProvider>
      <div className="flex items-center text-sm space-x-2">
        {isOffline ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Badge variant="destructive" className="gap-1">
                  <CloudOff className="h-3 w-3" />
                  <span>Offline</span>
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You're currently offline. Changes will sync when you reconnect.</p>
            </TooltipContent>
          </Tooltip>
        ) : isSyncing ? (
          <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Syncing...</span>
          </Badge>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                  <Check className="h-3 w-3" />
                  <span>Synced</span>
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>All changes are synchronized with the server</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {pendingChanges > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{pendingChanges} pending</span>
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You have {pendingChanges} changes waiting to be synced</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {!isOffline && !isSyncing && showForceSync && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => syncNow()}
            disabled={isSyncing}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Sync</span>
          </Button>
        )}
        
        {lastSyncTime && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground">
                Last: {formattedLastSync}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last synchronized on {format(lastSyncTime, "MMMM d, yyyy 'at' h:mm:ss a")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
} 